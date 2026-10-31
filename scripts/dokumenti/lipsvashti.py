"""task-dokumenti-lipsvashti.md — документите за видимите продукти без раздел „Документи".

  python -I -X utf8 scripts/dokumenti/lipsvashti.py [--svali]

Вход:
  content/dokumenti/bez-dokumenti.tsv — продуктите без раздела (`bez-dokumenti.py --tsv`)
  content/dokumenti/centrove.json     — центровете за сваляне eu/us/uk/ca/au (`centrove.mjs`)
  content/dokumenti/opis.json         — описът от етап 1 (вече внесените документи, и скритите)
Изход:
  content/dokumenti/lipsvashti-otchet.csv — за всеки продукт: какво е намерено и откъде,
    или „не е намерено никъде"; несигурните връзки — отделно отбелязани
  --svali → PDF-ите в content/dokumenti/originali/<продукт>/ (по SHA-256, без дубли)
    и content/dokumenti/lipsvashti-svaleni.json (адрес → файл, sha256, байтове)

Връзките са ръчни (по-долу): правило = регулярен израз по заглавието при EcoFlow.
Онлайн ръководствата (manuals.ecoflow.com) — проверени на 31.10.2026 с bg_BG и en_US
за /eu/product/ и /us/product/: при нито едно от намерените няма официален BG.
"""
import csv
import hashlib
import json
import re
import sys
import urllib.request
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from svali import UA, chisto  # noqa: E402

ROOT = Path(__file__).resolve().parents[2]
D = ROOT / 'content' / 'dokumenti'

# ── Нови документи от центровете: продукт → [(регулярен израз за заглавието, бележка)] ──
# При няколко копия на един документ (различни региони/адреси) се тегли всяко и се пазят
# различните по SHA-256; еднаквите — един файл.
NOVI = {
    'river-3': [(r'RIVER 3/RIVER 3 \(230\)/RIVER 3 \(10 ms UPS\)_User Manual', '')],
    'river-3-ups': [(r'RIVER 3/RIVER 3 \(230\)/RIVER 3 \(10 ms UPS\)_User Manual', 'ръководството е общо за RIVER 3 / RIVER 3 (230) / RIVER 3 (10 ms UPS)')],
    'delta-2-max': [(r'^EcoFlow DELTA 2 Max-User Manual \(EN\)$', 'онлайн, /eu/'),
                    (r'^EcoFlow DELTA 2 Max-QUICK START GUIDE', 'файлът е „DELTA Max(LFP)" — проверено, че е DELTA 2 Max')],
    'delta-3-smart-extra-battery': [(r'^EcoFlow DELTA 3 Smart Extra Battery_', '')],
    'wave-2-add-on-battery': [(r'WAVE 2 Add-on Battery-User Manual', '')],
    'solaren-panel-100w-flexible': [(r'100W Flexible Solar Panel-User Manual', 'многоезичен (EN+JA+CN+DE+FR+IT+ES+NL+RU+KR+HK)')],
    'solaren-panel-100w-rigid-2br': [(r'100W Rigid Solar Panel-User Manual', 'многоезичен (EN+JA+CN+DE+FR+IT+ES+NL+RU+KR+HK)')],
    'solaren-panel-400w-rigid-2br': [(r'400W Rigid Solar Panel-User Manual', 'многоезичен (EN+DE+FR+IT+ES+NL+RU)')],
    'solaren-panel-160w': [(r'160W/110W/ 60W Solar Panel User Manual', 'старият 160W — данните съвпадат с продукта (21,4 V, Vmp 18,2 V, 9,6 A, 21–22%); новият EF-Fold-P160-04 има отделно ръководство')],
    'solaren-panel-45w-type-c': [(r'^EcoFlow 45W Portable Solar Panel \(Type-C\)_User Manual', 'онлайн')],
    'solaren-panel-60w-type-c': [(r'^EcoFlow 60W Portable Solar Panel \(Type-C\)_User Manual', 'онлайн')],
    'solaren-panel-nextgen-220w-bifacial': [(r'^220W Bifacial Portable Solar Panel - User Manual', 'онлайн; EF-Fold-G220-04 — 220W отпред, 175W отзад (двулицевият; „NextGen 220W" EF-Fold-P220-04 е едностранният)')],
    'solar-tracker': [(r'^EcoFlow Solar Tracker-User Manual V1\.1', 'първата версия Solar Tracker (не Single Axis); V1.1 — по-новата от двете при EcoFlow')],
    'smart-home-panel': [(r'^EcoFlow Smart Home Panel (User Manual|installation Manual) V0\.1', 'европейският Smart Home Panel (EN+DE+FR+IT+ES+NL+RU), от центъра за AU'),
                         (r'^EcoFlow Smart Home Panel-APP User Manual', 'приложението')],
    'power-kit-console': [(r'Power Kit Console', 'многоезичен (EN+DE+FR+IT+ES+CHS)')],
    'power-kit-power-dock': [(r'^EcoFlow Power Dock_User Manual', 'онлайн')],
    'power-kit-power-hub': [(r'^EcoFlow Power Hub \(3\.6kW\)-User Manual', 'Power Hub 3.6 kW (230 V) — от центъра за AU; има и V1.4/V1.5 от CA/US (120 V)')],
    'power-kit-power-hub-5kva': [(r'^EcoFlow Power Hub 5kVA_', '')],
    'power-kit-power-link': [(r'^EcoFlow Power Link_User Manual', 'онлайн')],
    'power-kit-smart-distribution-panel': [(r'^EcoFlow AC DC Smart Distribution Panel-User Manual V1\.2', 'от центъра за AU (230 V); V1.3 от US е за 120 V')],
    'rapid-gan-charger-65w': [(r'RAPID 65W GaN Charger_Quick Start Guide', 'многоезичен')],
    'rapid-pro-charger-100w': [(r'RAPID Pro Charger ?\(100W', '')],
    'rapid-pro-charger-140w': [(r'RAPID Pro Charger ?\(140W', '')],
    'rapid-magnetic-5000-cheren': [(r'RAPID Magnetic Power Bank \(5000mAh\) (User Manual|Quick Start Guide)', '')],
    'rapid-magnetic-5000-srebrist': [(r'RAPID Magnetic Power Bank \(5000mAh\) (User Manual|Quick Start Guide)', '')],
    'rapid-pro-x-apple-watch-charger': [(r'RAPID Pro X Magnetic Block_User Manual', 'многоезичен')],
    'ev-x-stream-adapter-delta-pro': [(r'EV X-Stream Adapter-User Manual V0\.1', 'многоезичен; адаптерът за DELTA Pro')],
    'grounding-adapter-c20': [(r'Grounding Adapter-User Manual V1\.4', 'многоезичен; общ за DELTA Pro / DELTA Max / DELTA 2 / DELTA 2 Max, споменава и кабели за САЩ (NEMA)')],
    'delta-pro-remote-control': [(r'DELTA PRO Remote Control-User Manual', 'многоезичен')],
    'power-hat-l-xl': [(r'Power Hat_Quick Start Guide', '')],
    'power-hat-m-l': [(r'Power Hat_Quick Start Guide', '')],
    'stream-bkw-ac-cable-5m': [(r'STREAM BKW-AC Cable_Quick Start Guide', 'от центъра за UK')],
    'stream-bkw-ac-cable-15m': [(r'STREAM BKW-AC Cable_Quick Start Guide', 'от центъра за UK')],
    # Заглавието при EcoFlow е „STREAM Solar Panel Extension Cable…", файлът (и съдържанието) — BKW DIY Cable.
    'stream-bkw-diy-cable-5m': [(r'STREAM Solar Panel Extension Cable_Quick Start Guide', 'от центъра за UK; заглавието при EcoFlow е „STREAM Solar Panel Extension Cable", файлът и съдържанието — STREAM BKW DIY Cable')],
}

# ── Вече внесени документи (в описа), които стават и за тези продукти ──
# продукт → [(продуктите, чиито видими документи важат, или регулярен израз за заглавието, бележка)]
SASHTESTVUVASHTI = {
    'river-3-max': [(['river-3-plus', 'river-3-plus-eb300'], 'RIVER 3 Max = RIVER 3 Plus + Smart Extra Battery EB300 (eu.ecoflow.com) — официалните BG на двете')],
    'river-3-max-plus': [(['river-3-plus', 'river-3-plus-eb300'], 'RIVER 3 Max Plus = RIVER 3 Plus + Smart Extra Battery EB600 (eu.ecoflow.com); ръководството на батерията е общо за EB300/EB600')],
    'river-3-max-plus-wireless': [(['river-3-plus-wireless', 'river-3-plus-eb300'],
                                   'RIVER 3 Max Plus (Wireless) = RIVER 3 Plus (Wireless) + EB600 (eu.ecoflow.com); ръководството на батерията е общо за EB300/EB600')],
    'stream-ac-5000': [(r'STREAM 5000_AC 5000|App User Manual_for STREAM', 'скритите от етап 4 (продуктът го нямаше); приложението — според PDF-а само за STREAM 5000 / AC 5000')],
}

# ── Несигурни — НЕ се свързват, решава собственикът ──
NESIGURNI = {
    'delta-2-max': '„DELTA 2 Max Smart Extra Battery User Manual" (скрит; има и в AU/CA) — ръководство на допълнителната батерия, не на станцията. Да се покаже ли и при DELTA 2 Max?',
    'stream-ac-5000': '„STREAM Expansion Battery 5000 Installation Guide" (скрит) — за допълнителната батерия на STREAM 5000; не е ясно дали AC 5000 се разширява с нея.',
    'solaren-panel-45w-type-c': '„45W Portable Solar Panel (EF-Fold-P045-CG)" (скрит) — друг панел: изход с MC4/XT60i, без USB-C; за 45W (Type-C) има отделно ръководство (намерено).',
    'solaren-panel-60w-type-c': '„60W Portable Solar Panel (EF-Fold-P060-CG)" (скрит) — друг панел: изход с MC4/XT60i, без USB-C; за 60W (Type-C) има отделно ръководство (намерено).',
    'solar-tracker': '„Single Axis Solar Tracker" / „…2" — други модели (в сайта Single Axis е отделен продукт със свои документи).',
    'smart-home-panel': '„Smart Meter" / „Shelly" — уреди за балконските системи (STREAM/PowerStream), не за Smart Home Panel — не се свързват.',
    'relay-module-6a': 'Релейните модули са резервни части на Smart Home Panel — да се показват ли ръководствата на Smart Home Panel и при тях?',
    'relay-module-13a': 'както при Relay Module 6A',
    'relay-module-16a': 'както при Relay Module 6A',
    'relay-module-20a': 'както при Relay Module 6A',
    'relay-module-30a': 'както при Relay Module 6A',
    'power-kit-power-hub': '„Power Kits — Quick Start Guide" (V1.1 AU, V1.3 US) — общо за целия комплект; да се покаже ли при всеки продукт от Power Kits?',
    'stream-solar-extension-cable': '„STREAM Solar Panel Extension Cable_Quick Start Guide" (UK) не е за него — файлът и съдържанието са за STREAM BKW DIY Cable (свързан там).',
    'delta-pro-3-ev-x-stream-adapter': 'Намерено е само ръководството на EV X-Stream Adapter за DELTA Pro (2022) — за DELTA Pro 3 не се знае дали важи.',
}

# dice.bg (проверено на 31.10.2026): при нито един от ненамерените няма прикачен PDF; при
# тези в описанието пише, че в кутията има ръководство — на хартия, онлайн го няма.
DICE_V_KUTIYATA = {'camping-light', 'tilt-mount-bracket-28'}

# Защо няма — за аксесоарите, при които е нормално.
BEZ_RAKOVODSTVO = re.compile(r'Cable|Кабел|Bag|Hat|Cushion|Chair|Pipe|Strap|Feet|Angle Guide|Tilt Mount|Trolley|Dolly|Wheels')


def main(svali):
    bez = [l.split('\t') for l in (D / 'bez-dokumenti.tsv').read_text(encoding='utf8').splitlines() if l.strip()]
    centrove = json.loads((D / 'centrove.json').read_text(encoding='utf8'))['zapisi']
    opis = json.loads((D / 'opis.json').read_text(encoding='utf8'))
    v_opisa = {z['adres'] for z in opis}
    svaleni_p = D / 'lipsvashti-svaleni.json'
    svaleni = json.loads(svaleni_p.read_text(encoding='utf8')) if svaleni_p.exists() else {}
    po_sha = {v['sha256']: v['fail'] for v in svaleni.values()}

    redove = []
    for adres, ime in bez:
        slug = adres.rstrip('/').rsplit('/', 1)[-1]
        nameri = []
        for rx, bel in NOVI.get(slug, []):
            for z in edin_na_zaglavie([z for z in centrove if re.search(rx, z['zaglavie'])]):
                nameri.append(('нов', z['zaglavie'], z['vid'], z['adres'], ', '.join(z['regioni']),
                               '; '.join(x for x in (bel, 'вече е в описа' if z['adres'] in v_opisa else '') if x)))
        for izt, bel in SASHTESTVUVASHTI.get(slug, []):
            vidyani = set()
            for z in opis:
                if isinstance(izt, list):
                    if z['skrit'] or not set(izt) & set(z['produkti']):
                        continue
                elif not re.search(izt, z['zaglavie']):
                    continue
                if z['zaglavie'] in vidyani:
                    continue
                vidyani.add(z['zaglavie'])
                nameri.append(('вече внесен' + (' (скрит)' if z['skrit'] else ''), z['zaglavie'], z['tip'], z['adres'],
                               'eu', bel))
        for vid, zagl, tip, a, reg, bel in nameri:
            fail = ''
            if svali and vid == 'нов' and a.lower().endswith('.pdf'):
                fail = svali_pdf(a, zagl, slug, svaleni, po_sha)
            elif a in svaleni:
                fail = svaleni[a]['fail']
            redove.append([ime, adres, vid, zagl, tip, reg, a, fail, bel, ''])
        nes = NESIGURNI.get(slug, '')
        if not nameri:
            zashto = '; '.join(x for x in (
                'аксесоар — обикновено без ръководство при EcoFlow' if BEZ_RAKOVODSTVO.search(ime) else '',
                'в кутията има ръководство (dice.bg), онлайн го няма' if slug in DICE_V_KUTIYATA else '',
                'няма в центровете eu/us/uk/ca/au, в manuals.ecoflow.com и в dice.bg') if x)
            redove.append([ime, adres, 'не е намерено никъде', '', '', '', '', '', zashto, nes])
        elif nes:
            redove[-1][9] = nes
        if svali:
            svaleni_p.write_text(json.dumps(svaleni, ensure_ascii=False, indent=1) + '\n', encoding='utf8')

    with open(D / 'lipsvashti-otchet.csv', 'w', encoding='utf-8-sig', newline='') as f:
        w = csv.writer(f, delimiter=';')
        w.writerow(['продукт', 'адрес в сайта', 'намерено', 'документ (заглавие при EcoFlow)', 'вид/тип', 'центрове',
                    'адрес на документа', 'свален файл', 'бележка', 'несигурно — за собственика'])
        w.writerows(redove)
    produkti = {r[1] for r in redove}
    s_dok = {r[1] for r in redove if r[2] != 'не е намерено никъде'}
    print(f'продукти: {len(produkti)}, с документ: {len(s_dok)}, без: {len(produkti) - len(s_dok)}; редове: {len(redove)}')


REGION_RED = ['eu', 'uk', 'us', 'ca', 'au']


def edin_na_zaglavie(zapisi):
    """Едно и също заглавие на няколко адреса (копия по региони) → едно: на първия регион
    от REGION_RED (EU, после UK …), при равни — по-новото."""
    def klyuch(z):
        return re.sub(r'[\s_\-()（）]+|\(en\)', '', z['zaglavie'].lower())
    nai = {}
    for z in sorted(zapisi, key=lambda z: (min(REGION_RED.index(r) for r in z['regioni']), -int(z['data'].replace('-', '') or 0))):
        nai.setdefault(klyuch(z), z)
    return list(nai.values())


def ime_na_fayla(adres, zaglavie):
    """Името — от адреса (както `svali.py`); ако там е само номер или общо име — от заглавието."""
    ime = chisto(adres)
    zaglavie = zaglavie.replace('/', ' ')
    if re.fullmatch(r'[\d-]+|solar-panel-user-manual|dokument', ime):
        ime = chisto(zaglavie + '.pdf')
    return ime


def svali_pdf(adres, zaglavie, slug, svaleni, po_sha):
    if adres in svaleni and (D / svaleni[adres]['fail']).exists():
        return svaleni[adres]['fail']
    req = urllib.request.Request(adres.replace(' ', '%20'), headers={'User-Agent': UA})
    with urllib.request.urlopen(req, timeout=180) as r:
        data = r.read()
    if not data.startswith(b'%PDF'):
        raise SystemExit(f'не е PDF: {adres}')
    sha = hashlib.sha256(data).hexdigest()
    if sha in po_sha:
        fail = po_sha[sha]
    else:
        ime = ime_na_fayla(adres, zaglavie)
        fail = f'originali/{slug}/{ime}.pdf'
        n = 2
        while (D / fail).exists():
            fail = f'originali/{slug}/{ime}-{n}.pdf'
            n += 1
        (D / fail).parent.mkdir(parents=True, exist_ok=True)
        (D / fail).write_bytes(data)
        po_sha[sha] = fail
        print(f'↓ {fail} ({len(data) // 1024} KB)')
    svaleni[adres] = {'fail': fail, 'sha256': sha, 'bayta': len(data)}
    return fail


main('--svali' in sys.argv)
