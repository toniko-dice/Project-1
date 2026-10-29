"""Етап 2 на `task-dokumenti.md` — сваляне на оригиналните PDF-и от описа.

  python -I -X utf8 scripts/dokumenti/svali.py [<папка за документите>]

По подразбиране → content/dokumenti/ до този скрипт (в git е само описът;
PDF-ите са в .gitignore). Файл → originali/<първия видим продукт или bez-produkt>/<чисто-име>.pdf.
Чисто име: латиница, малки букви, „-“, без интервали и %20, без времевия печат на EcoFlow.
Еднакви по SHA-256 → един файл (останалите адреси сочат него). Повторно пускане не тегли
наново вече сваленото. Пише content/dokumenti/svaleni.json (адрес → файл, sha256, байтове, страници).
"""
import hashlib
import json
import re
import sys
import time
import unicodedata
import urllib.parse
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
SRC = ROOT / 'content' / 'dokumenti'
OUT = Path(sys.argv[1]) if len(sys.argv) > 1 else SRC
UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0 Safari/537.36'
TRANS = dict(zip('абвгдежзийклмнопрстуфхцчшщъьюяыэё', 'a b v g d e zh z i y k l m n o p r s t u f h ts ch sh sht a y yu ya y e yo'.split()))


def chisto(url):
    ime = urllib.parse.unquote(url.rsplit('/', 1)[-1])
    ime = re.sub(r'\.pdf$', '', ime, flags=re.I)
    ime = re.sub(r'_\d{13}$', '', ime)            # времевият печат на EcoFlow
    ime = ime.replace('副本', '').replace('×', 'x').replace('&', 'and').replace('+', '-')
    ime = ''.join(TRANS.get(c, TRANS.get(c.lower(), c)) for c in ime)
    ime = unicodedata.normalize('NFKD', ime).encode('ascii', 'ignore').decode()
    ime = re.sub(r'[^a-zA-Z0-9]+', '-', ime).strip('-').lower()
    return re.sub(r'-{2,}', '-', ime) or 'dokument'


def main():
    opis = json.loads((SRC / 'opis.json').read_text(encoding='utf8'))
    svaleni_p = OUT / 'svaleni.json'
    svaleni = json.loads(svaleni_p.read_text(encoding='utf8')) if svaleni_p.exists() else {}
    pdf = [z for z in opis if z['tip'] == 'pdf']
    # Преподреждане: свален файл, чиято папка вече не отговаря на описа (сменена връзка) → в правилната.
    papka_za = {z['adres']: (z['produkti'][0] if z['produkti'] else 'bez-produkt') for z in pdf}
    vidyan = set()  # общ файл (еднакъв SHA за няколко адреса) — папката му е по първия адрес в описа
    for url in [z['adres'] for z in pdf]:
        v = svaleni.get(url)
        if not v or not (OUT / v['fail']).exists() or v['sha256'] in vidyan:
            continue
        vidyan.add(v['sha256'])
        nova = f"originali/{papka_za[url]}/{Path(v['fail']).name}"
        if nova != v['fail'] and not (OUT / nova).exists():
            (OUT / nova).parent.mkdir(parents=True, exist_ok=True)
            (OUT / v['fail']).rename(OUT / nova)
            stara = v['fail']
            for w in svaleni.values():
                if w['fail'] == stara:
                    w['fail'] = nova
            print(f'преместен: {stara} → {nova}')
            try:
                (OUT / stara).parent.rmdir()
            except OSError:
                pass
    svaleni_p.write_text(json.dumps(svaleni, ensure_ascii=False, indent=2) + '\n', encoding='utf8')
    po_sha = {v['sha256']: v['fail'] for v in svaleni.values() if v.get('sha256')}
    greshki = []
    for i, z in enumerate(pdf, 1):
        url = z['adres']
        if url in svaleni and (OUT / svaleni[url]['fail']).exists():
            continue
        papka = z['produkti'][0] if z['produkti'] else 'bez-produkt'
        try:
            req = urllib.request.Request(url, headers={'User-Agent': UA, 'Referer': 'https://www.ecoflow.com/'})
            with urllib.request.urlopen(req, timeout=120) as r:
                data = r.read()
                ctype = r.headers.get('Content-Type', '')
        except Exception as e:  # noqa: BLE001
            greshki.append(f'{url} — {e}')
            print(f'[{i}/{len(pdf)}] ГРЕШКА {z["zaglavie"]}: {e}', flush=True)
            continue
        if not data.startswith(b'%PDF'):
            greshki.append(f'{url} — не е PDF ({ctype}, {len(data)} байта)')
            print(f'[{i}/{len(pdf)}] НЕ Е PDF {z["zaglavie"]}', flush=True)
            continue
        sha = hashlib.sha256(data).hexdigest()
        if sha in po_sha:
            fail = po_sha[sha]
            print(f'[{i}/{len(pdf)}] същият като {fail}', flush=True)
        else:
            rel = f'originali/{papka}/{chisto(url)}.pdf'
            n = 2
            while (OUT / rel).exists():
                rel = f'originali/{papka}/{chisto(url)}-{n}.pdf'
                n += 1
            (OUT / rel).parent.mkdir(parents=True, exist_ok=True)
            (OUT / rel).write_bytes(data)
            po_sha[sha] = fail = rel
            print(f'[{i}/{len(pdf)}] {len(data) // 1024} KB → {rel}', flush=True)
        stranici = len(re.findall(rb'/Type\s*/Page[^s]', data))
        svaleni[url] = {'fail': fail, 'sha256': sha, 'bajtove': len(data), 'stranici': stranici, 'zaglavie': z['zaglavie']}
        svaleni_p.write_text(json.dumps(svaleni, ensure_ascii=False, indent=2) + '\n', encoding='utf8')
        time.sleep(0.3)
    print(f'готово: {len(svaleni)} адреса, {len(set(v["fail"] for v in svaleni.values()))} файла, грешки: {len(greshki)}')
    for g in greshki:
        print('  ', g)


main()
