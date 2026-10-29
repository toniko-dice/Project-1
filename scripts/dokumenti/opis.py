"""Етап 1 на `task-dokumenti.md` — опис на документите на EcoFlow EU.

Вход:
  content/dokumenti/raw.tsv            — списъкът от центъра за сваляне (33 страници,
                                         295 записа, 153 адреса; събран с браузъра —
                                         API-то без заглавията на сайта връща total: 0)
  content/dokumenti/produkti-sarvar.tsv — продуктите от базата НА СЪРВЪРА
                                         (slug, статус, скрита категория, sku, име)
Изход:
  content/dokumenti/opis.json, content/dokumenti/opis.csv (за Excel, UTF-8 с BOM)

  python -I -X utf8 scripts/dokumenti/opis.py
"""
import csv
import json
import re
from urllib.parse import unquote
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
D = ROOT / 'content' / 'dokumenti'
PREFIX = {
    '$E': 'https://ecoflow-service-us-prod.oss-us-west-1.aliyuncs.com/cms/upload',
    '$W': 'https://websiteoss.ecoflow.com/cms/upload',
    '$M': 'https://manuals.ecoflow.com',
}

# ── Официален български (manuals.ecoflow.com/eu/product/<slug>?lang=bg_BG) ──
# Проверено на 29.10.2026: при тези данните с bg_BG са с хиляди кирилски букви; при
# всички останали онлайн ръководства bg_BG дава празен отговор, а en_US — пълен.
BG_OFICIALNI = {
    'delta-3': ['delta-3'], 'delta-3-plus': ['delta-3-plus'], 'delta-3-classic': ['delta-3-classic'],
    'delta-3-max': ['delta-3-max'], 'delta-3-max-plus': ['delta-3-max-plus'],
    'delta-3-max-plus-smart-extra-battery': ['delta-3-max-plus-smart-extra-battery'],
    'delta-3-ultra-plus': ['delta-3-ultra-plus'], 'river-3-plus': ['river-3-plus'],
    'river-3-plus-smart-extra-battery': ['river-3-plus-eb300'],
    'stream-pro-and-ultra': ['stream-pro', 'stream-ultra'], 'stream-ultra-x': ['stream-ultra-x'],
    'stream-ac-pro': [], 'stream-max': [], 'stream-ac': [], 'wave-3': ['wave-3', 'wave-3-s-bateriya'],
    'alternator-charger-600': [], 'alternator-charger-plus-1000': [], 'single-axis-solar-tracker-2': [],
    '175w-rigid-solar-panel': ['solaren-panel-175w-rigid'], '130w-rvmax-rigid-solar-panel': ['solaren-panel-130w-rvmax-2br'],
    '400w-lightweight-solar-panel': ['solaren-panel-400w-lightweight'], '220w-lightweight-solar-panel': ['solaren-panel-220w-lightweight'],
    '160w-lightweight-solar-panel': ['solaren-panel-160w-lightweight'], '250w-rigid-solar-panel': ['solaren-panel-250w-rigid-4br'],
    '110w-lightweight-solar-panel': ['solaren-panel-110w-lightweight'], 'solar-panel-28w': [],
}
# Синоними на slug-а на онлайн ръководство (същото ръководство под друг адрес).
SLUG_ALIAS = {'110w-lightweight-portable-solar-panel': '110w-lightweight-solar-panel'}

# ── Връзка документ → продукти в сайта ──
# (регулярен израз по заглавието, slug-ове, бележка, несигурна ли е връзката). Първото съвпадение печели.
WAVE3 = ['wave-3', 'wave-3-s-bateriya']
WAVE3_BAT = ['wave-3-add-on-battery', 'wave-3-s-bateriya']
GLACIER = ['glacier-classic-35l', 'glacier-classic-45l', 'glacier-classic-55l']
ALT_CABLES = ['alternator-charger-custom-fit-output-cable-2m', 'alternator-charger-plus-1000-solar-input-cable-5m',
              'alternator-charger-plus-custom-fit-output-cable-2m', 'alternator-charger-xt150-cable-1m',
              'alternator-charger-xt150-cable-2m', 'alternator-charger-xt60-output-cable-1m']
PRAVILA = [
    (r'DELTA Pro Ultra', ['delta-pro-ultra'], '', False),
    (r'DELTA Pro 3', ['delta-pro-3'], '', False),
    (r'DELTA 2 Max Smart Extra Battery', [], 'DELTA 2 Max Smart Extra Battery (в сайта е само DELTA 2 Max)', False),
    (r'DELTA 3 Max Plus Smart Extra Battery', ['delta-3-max-plus-smart-extra-battery'], '', False),
    (r'DELTA 3 Max Plus', ['delta-3-max-plus'], '', False),
    (r'DELTA 3 Max', ['delta-3-max'], '', False),
    (r'DELTA 3 Classic', ['delta-3-classic'], '', False),
    (r'DELTA 3[ _]', ['delta-3'], '', False),
    (r'RIVER 3 Plus \(Wireless\)', ['river-3-plus-wireless'], '', False),
    (r'RIVER Mini', [], 'RIVER mini', False),
    # PDF-ът (проверен): Pegboard, Storage Bag, Tray Table, Protective Cover, Slide with Straps — в сайта са само калъфите.
    (r'GLACIER Classic Accessories', ['glacier-classic-protective-cover-35l', 'glacier-classic-protective-cover-45l',
                                      'glacier-classic-protective-cover-55l'], 'в сайта са само калъфите (Protective Cover)', False),
    (r'GLACIER Plug-in Battery', ['glacier-plug-in-battery'], '', False),
    (r'GLACIER Classic', GLACIER, '', False),
    (r'Smart Cooling Deck', [], 'Smart Cooling Deck', False),
    (r'WAVE 3 Add-on Battery', WAVE3_BAT, '', False),
    (r'WAVE 3 Accessories', ['wave-3-car-vent-seal', 'shower-kit'], 'PDF-ът: Velcro Strap Handle, Car Vent Seal, Shower Kit — дръжката я няма в сайта', False),
    (r'Shower Kit', ['shower-kit'], '', False),
    (r'WAVE 3', WAVE3, '', False),
    (r'STREAM Ultra ?& ?Pro|STREAM Ultra&Pro', ['stream-pro', 'stream-ultra'], '', False),
    (r'STREAM DIY Front Case', [], 'STREAM DIY Front Case (за STREAM Ultra X) — аксесоарът го няма в сайта', True),
    (r'STREAM Ultra X', ['stream-ultra-x'], '', False),
    (r'STREAM Microinverter', ['stream-microinverter'], '', False),
    (r'STREAM Parallel Cable', ['stream-parallel-cable'], '', False),
    (r'App User Manual_for STREAM', [], 'приложението — според PDF-а само за STREAM 5000 / AC 5000', False),
    (r'STREAM (AC Pro|AC|Max|5000|Gateway|Expansion Battery)', [], 'STREAM AC / AC Pro / Max / 5000 / Gateway / Expansion Battery 5000', False),
    (r'PowerStream|Микроинвертор EcoFlow PowerStream', [], 'PowerStream', False),
    (r'Smart Meter Dual CT', [], 'Smart Meter Dual CT — друг модел от „Smart Meter“ в сайта', True),
    (r'Shelly Smart Meter', ['shelly-pro-3em-smart-meter'], '', False),
    (r'Shelly Smart Plug', ['smart-plug'], '', False),
    (r'Smart Meter User Manual', ['smart-meter'], '', False),
    (r'Smart Plug User Manual V1\.0', [], 'EcoFlow Smart Plug (старият, не Shelly) — в сайта е × Shelly Smart Plug', True),
    (r'P1 Meter', [], 'P1 Meter', False),
    (r'PowerInsight', [], 'PowerInsight 2', False),
    (r'Manual Transfer Switch', ['manual-transfer-switch'], '', False),
    (r'Balcony Hook Kit', ['balcony-hook-kit'], '', False),
    (r'Adjustable Ground & Suspended', ['adjustable-ground-suspended-solar-bracket'], '', False),
    (r"50'' Tilt Mount", [], '50” Tilt Mount Bracket (в сайта е 28”)', False),
    (r'Bracket|PV Clamp Holder', [], 'стойките Bracket (Facade, Balcony, Roof, Lightweight…) и PV Clamp Holder', False),
    (r'Single Axis Solar Tracker 2', [], 'Single Axis Solar Tracker 2 (в сайта е първата версия)', False),
    (r'Single Axis Solar Tracker', ['single-axis-solar-tracker'], '', False),
    (r'Cables for Alternator Charger', ALT_CABLES, 'PDF-ът: XT150 1/2 m, XT60 1 m, Output 2 m, Solar Input 5 m', False),
    (r'Alternator Charger', [], 'Alternator Charger (500W / 600 / Plus 1000)', False),
    (r'RAPID Pro X Power Bank', ['rapid-pro-x-power-bank'], '', False),
    (r'RAPID Pro Desktop Charger', ['rapid-pro-desktop-charger-320w'], '', False),
    (r'RAPID Pro Power Bank \(27650mAh', ['rapid-pro-power-bank-27650'], '', False),
    (r'RAPID Pro Power Bank \(20000mAh', ['rapid-pro-power-bank-20000'], '', False),
    (r'RAPID Magnetic Power Bank \(10000mAh\)', [], 'RAPID Magnetic 10000mAh (в сайта е 5000mAh)', True),
    (r'RAPID', [], 'RAPID Power Bank / 3-in-1 / Mag — моделите ги няма в сайта', False),
    (r'HeatGuard', [], 'HeatGuard Solar Film', False),
    (r'2kWh & 5kWh LFP Battery', [], 'LFP батерия 2/5 kWh (в сайта са само кабелите за нея)', False),
    (r'TRAIL 200 DC', [], 'TRAIL 200/300 DC (категорията TRAIL е скрита)', False),
    (r'110W (Lightweight )?Portable Solar Panel', ['solaren-panel-110w-lightweight'], '', False),
    (r'130W RVMax', ['solaren-panel-130w-rvmax-2br'], '', False),
    (r'160W Lightweight', ['solaren-panel-160w-lightweight'], '', False),
    (r'175W Rigid', ['solaren-panel-175w-rigid'], '', False),
    (r'220W Lightweight', ['solaren-panel-220w-lightweight'], '', False),
    (r'250W Rigid', ['solaren-panel-250w-rigid-4br'], '', False),
    (r'400W Lightweight', ['solaren-panel-400w-lightweight'], '', False),
    (r'450W Rigid', ['solaren-panel-450w-rigid-2br'], '', False),
    # Онлайн ръководството на EF-Fold-P0x0-CG не споменава Type-C (Voc 25,5 V); в сайта са панелите с USB-C изход.
    (r'60W Portable Solar Panel \(EF-Fold-P060-CG\)', [], 'EF-Fold-P060-CG — не е доказано, че е 60W (Type-C) от сайта', True),
    (r'45W Portable Solar Panel \(EF-Fold-P045-CG\)', [], 'EF-Fold-P045-CG — не е доказано, че е 45W (Type-C) от сайта', True),
    (r'28W Portable Solar Panel', [], '28W Portable Solar Panel', False),
    (r'520W Rigid', [], '520W Rigid Solar Panel', False),
]

# Скрити по решение на собственика (по-стара версия на документ, който има по-нов) — регулярен израз за заглавието → бележка.
SKRITI_RESHENIE = {
    r'STREAM Ultra & Pro_Installation Guide_en\+de\+fr_V1\.0': 'по-старата версия (V1.0 en+de+fr) — има по-ново „STREAM Ultra&Pro Installation Guide"',
}

VIDOVE = [  # (регулярен израз, вид) — по реда
    (r"What's in the Box|App User Manual", 'Друго'),
    (r'Safety Instruction', 'Инструкции за безопасност'),
    (r'Quick Start Guide|QSG', 'Кратко ръководство (Quick Start)'),
    (r'Installation Guide', 'Ръководство за монтаж'),
    (r'User Manual|User manual|Handleiding|Руководство|Manual', 'Ръководство за потребителя'),
]


def ezik(title, url):
    t = f'{title} {url}'
    if re.search(r'[а-яА-Я]', title) or re.search(r'\(RU\)', t):
        return 'RU'
    for code, rx in [('NL', r'\(NL\)'), ('PL', r'\bPL\b'), ('DA', r'_da(\.pdf)?$'), ('NO', r'_no(\.pdf)?$'),
                     ('SV', r'_sv(\.pdf)?$'), ('FI', r'_fi(\.pdf)?$')]:
        if re.search(rx, title) or re.search(rx, url.split('/')[-1]):
            return code
    if re.search(r'multilingual|Multilingual|Global|global|en\+de|EN-DE|EN\+DE|EN,FR', t):
        return 'многоезичен'
    return 'EN'


def main():
    produkti = {}
    for l in (D / 'produkti-sarvar.tsv').read_text(encoding='utf8').splitlines():
        slug, status, skrita, sku, ime = l.split('\t')
        produkti[slug] = {'ime': ime, 'vidim': status == 'published' and skrita == '0'}

    zapisi = []
    for l in (D / 'raw.tsv').read_text(encoding='utf8').splitlines():
        if not l.strip() or l.startswith('#'):
            continue
        title, date, kind, u, n, drugi = l.split('\t')
        url = next((v + u[len(k):] for k, v in PREFIX.items() if u.startswith(k + '/')), u)
        zapisi.append({'zaglavie': title, 'drugi_zaglavia': [x.strip() for x in drugi.split('||') if x.strip()],
                       'data': date, 'tip': kind, 'adres': url, 'pati_v_spisaka': int(n)})

    # Онлайн ръководствата с официален BG, които ги няма в центъра за сваляне.
    v_spisaka = {SLUG_ALIAS.get(re.sub(r'[/?].*', '', re.sub(r'^.*?/product/', '', z['adres'])), None)
                 for z in zapisi if z['tip'] == 'online'}
    v_spisaka |= {re.sub(r'[/?].*', '', re.sub(r'^.*?/product/', '', z['adres'])) for z in zapisi if z['tip'] == 'online'}
    for s in BG_OFICIALNI:
        if s not in v_spisaka:
            zapisi.append({'zaglavie': f'EcoFlow {s} — User Manual (официален превод на български)', 'drugi_zaglavia': [],
                           'data': '', 'tip': 'online-bg', 'adres': f'{PREFIX["$M"]}/eu/product/{s}?lang=bg_BG',
                           'pati_v_spisaka': 0})

    # EcoFlow понякога сочи заглавие към чужд файл („DELTA Pro Ultra Inverter Safety Instructions"
    # → файлът на краткото ръководство). Ако видът по името на файла е друг — важи файлът.
    for z in zapisi:
        if z['tip'] != 'pdf':
            continue
        fail = re.sub(r'\.pdf$', '', unquote(z['adres'].rsplit('/', 1)[-1]), flags=re.I)
        vid_t = next((v for rx, v in VIDOVE if re.search(rx, z['zaglavie'])), None)
        vid_f = next((v for rx, v in VIDOVE if re.search(rx, fail)), None)
        if vid_f and vid_t and vid_f != vid_t:
            z['zaglavie_ecoflow'] = z['zaglavie']
            z['zaglavie'] = fail

    zaglavia_adresi = {}
    for z in zapisi:
        zaglavia_adresi.setdefault(z['zaglavie'], []).append(z['adres'])

    for z in zapisi:
        t = z['zaglavie']
        z['vid'] = next((v for rx, v in VIDOVE if re.search(rx, t)), 'Друго')
        z['ezik'] = 'BG' if z['tip'] == 'online-bg' else ezik(t, z['adres'])
        pr = next(((s, note, nes) for rx, s, note, nes in PRAVILA if re.search(rx, t)), None)
        slugs, bel, nesig = (pr if pr else ([], 'няма правило — провери', True))
        bg = '—'
        if z['tip'] in ('online', 'online-bg'):
            s = re.sub(r'[/?].*', '', re.sub(r'^.*?/product/', '', z['adres']))
            s = SLUG_ALIAS.get(s, s)
            if s in BG_OFICIALNI:
                bg = 'официален'
                z['bg_adres'] = f'{PREFIX["$M"]}/eu/product/{s}?lang=bg_BG'
                if z['tip'] == 'online-bg':
                    slugs = BG_OFICIALNI[s]
                    bel = '' if slugs else 'продуктът го няма в сайта'
                    nesig = False
        if bg == '—' and z['ezik'] in ('EN', 'многоезичен'):
            bg = 'превод'
        if z['ezik'] in ('RU', 'NL', 'PL', 'DA', 'NO', 'SV', 'FI'):
            bg = '— (само оригинал: друг език, има EN/BG вариант)' if slugs or 'PowerStream' in t else '— (друг език)'
        neizvestni = [s for s in slugs if s not in produkti]
        assert not neizvestni, (t, neizvestni)
        vidimi = [s for s in slugs if produkti[s]['vidim']]
        z['produkti'] = vidimi
        z['produkti_imena'] = [produkti[s]['ime'] for s in vidimi]
        z['skrit'] = not vidimi or z['ezik'] in ('RU', 'NL', 'PL', 'DA', 'NO', 'SV', 'FI')
        for rx, prichina in SKRITI_RESHENIE.items():
            if re.search(rx, t):
                z['skrit'] = True
                bel = '; '.join(x for x in (bel, f'скрит: {prichina}') if x)
        z['bg_iztochnik'] = bg
        z['nesigurna_vrazka'] = nesig
        if z.get('zaglavie_ecoflow'):
            bel = '; '.join(x for x in (bel, f'заглавието при EcoFlow („{z["zaglavie_ecoflow"]}") сочи друг вид файл — името е по файла') if x)
        z['belezhka'] = bel
        z['dubli_po_zaglavie'] = len(zaglavia_adresi[t]) > 1

    zapisi.sort(key=lambda z: (z['skrit'], (z['produkti'] or ['яяя'])[0], z['vid'], z['zaglavie']))
    (D / 'opis.json').write_text(json.dumps(zapisi, ensure_ascii=False, indent=2) + '\n', encoding='utf8')
    with open(D / 'opis.csv', 'w', encoding='utf-8-sig', newline='') as f:
        w = csv.writer(f, delimiter=';')
        w.writerow(['заглавие', 'вид', 'език', 'тип', 'адрес', 'продукт(и) в сайта', 'скрит', 'BG източник',
                    'несигурна връзка', 'бележка', 'дубъл по заглавие', 'дата', 'други заглавия на EcoFlow'])
        for z in zapisi:
            w.writerow([z['zaglavie'], z['vid'], z['ezik'], z['tip'], z['adres'],
                        ', '.join(z['produkti_imena']) or 'няма', 'да' if z['skrit'] else 'не', z['bg_iztochnik'],
                        'да' if z['nesigurna_vrazka'] else '', z['belezhka'], 'да' if z['dubli_po_zaglavie'] else '',
                        z['data'], ' || '.join(z['drugi_zaglavia'])])
    print(f'{len(zapisi)} записа → opis.json, opis.csv')


main()
