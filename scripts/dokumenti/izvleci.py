"""
Етап 5 на `task-dokumenti.md` — списъкът за превод и английският текст на всеки оригинал.

    python scripts/dokumenti/izvleci.py [<папка с документите>]

Чете `content/dokumenti/opis.json` (git) и `<папка>/svaleni.json` (по подразбиране
`content/dokumenti`). Пише:
  - `content/dokumenti/prevodi/spisak.json` (git) — един запис за всеки оригинал без
    официален BG: id, файл, продукти, заглавие, версия, адрес, вид, ред на превода;
  - `<папка>/izvlecheni/<id>.txt` (не е в git) — английският текст по страници
    („=== стр. N ==="); само английските абзаци (и описаните като „EN" често са многоезични).

Текстът — `pdftotext` (без `-layout`: двете колони идват една след друга).
Езикът — по абзаци, по честите думи; абзац без думи (числа, таблица) върви с
предишния. Страница без текст → „сканиран" в списъка (не се превежда).
"""
import json
import re
import shutil
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
D = ROOT / 'content' / 'dokumenti'
DOC = Path(sys.argv[1]) if len(sys.argv) > 1 else D
PDFTOTEXT = shutil.which('pdftotext') or 'pdftotext'

# Редът на превода: първо видимите, по групи (task-dokumenti.md); после скритите.
GRUPI = [
    r'^(delta|river|trail)', r'^glacier', r'^rapid', r'^solaren-panel|solar', r'^stream|^smart|^shelly',
    r'bracket|hook|tracker|stoyka', r'^wave|shower', r'alternator', r'.',
]

DUMI = {
    'EN': 'the and to of is with not for this that be or are your by from when use do if before can will it as on in please product device'.split(),
    'DE': 'und der die das nicht mit ist sie für von zu den des ein eine bei dem oder wenn auf werden sich'.split(),
    'FR': 'le la les et des du une un pas est pour dans que vous ne avec sur ce au produit lorsque'.split(),
    'IT': 'il di che non per con una della del sono le gli da prodotto quando questo si'.split(),
    'ES': 'el los las y del que no por con una para se su es producto cuando este'.split(),
    'NL': 'de het een en van niet met voor op dat is te bij u wordt als product'.split(),
    'PL': 'i nie w z na się do jest lub oraz przez produktu należy'.split(),
    'SV': 'och att det är för med inte som på av produkten'.split(),
}


def ezik(t: str):
    w = re.findall(r"[a-zà-ÿäöüßąćęłńóśźż']+", t.lower())
    if len(w) < 4:
        return None
    sc = {k: sum(1 for x in w if x in v) for k, v in DUMI.items()}
    best = max(sc, key=sc.get)
    return best if sc[best] >= 2 else None


def stranica(pdf: Path, n: int) -> str:
    r = subprocess.run([PDFTOTEXT, '-enc', 'UTF-8', '-f', str(n), '-l', str(n), str(pdf), '-'], capture_output=True)
    return r.stdout.decode('utf8', 'replace')


def broi_str(pdf: Path) -> int:
    import pypdfium2
    return len(pypdfium2.PdfDocument(str(pdf)))


def izvleci(pdf: Path, mnogoezichen: bool):
    """→ (текст с маркери на страниците, страниците с английски, сканирани страници)."""
    out, en_str, prazni = [], [], 0
    posleden = 'EN'
    n = broi_str(pdf)
    for p in range(1, n + 1):
        t = stranica(pdf, p)
        if len(t.strip()) < 20:
            prazni += 1
            continue
        abz = [a.strip() for a in re.split(r'\n\s*\n', t) if a.strip()]
        zapazeni = []
        for a in abz:
            e = ezik(a)
            if e:
                posleden = e
            if not mnogoezichen or (e or posleden) == 'EN':
                zapazeni.append(a)
        if zapazeni:
            en_str.append(p)
            out.append(f'=== стр. {p} ===\n' + '\n\n'.join(zapazeni))
    return '\n\n'.join(out) + '\n', en_str, prazni, n


def versiya(zaglavie: str, tekst: str):
    """От заглавието; ако там я няма — „V1.2" от първата страница на PDF-а."""
    m = re.search(r'\bV\s?(\d+(?:\.\d+)*)', zaglavie, re.I)
    if m:
        return m[1]
    parva = tekst.split('=== стр.')[1] if '=== стр.' in tekst else tekst
    m = re.search(r'(?<![\w.])V(\d+\.\d+(?:\.\d+)?)(?![\w.])', parva)
    return m[1] if m else None


def main():
    opis = json.loads((D / 'opis.json').read_text(encoding='utf8'))
    svaleni = json.loads((DOC / 'svaleni.json').read_text(encoding='utf8'))
    po_adres = {r['adres']: r for r in opis}
    zadachi = {}
    # PDF оригиналите — по SHA-256 (един файл → един превод).
    for url, s in svaleni.items():
        r = po_adres.get(url)
        if not r or r['bg_iztochnik'] != 'превод':
            continue
        z = zadachi.setdefault(s['sha256'], {'redove': [], 'fail': s['fail'], 'kluch': {'sha256': s['sha256']}})
        z['redove'].append(r)
    # Онлайн ръководствата без BG — отпечатаният английски PDF.
    for r in opis:
        if r['tip'] == 'online' and r['bg_iztochnik'] == 'превод':
            slug = re.sub(r'[/?].*', '', re.sub(r'^.*?/product/', '', r['adres']))
            f = f"originali/{(r['produkti'] or ['bez-produkt'])[0]}/{slug}-user-manual-en.pdf"
            zadachi[r['adres']] = {'redove': [r], 'fail': f, 'kluch': {'sourceUrl': r['adres']}}

    (DOC / 'izvlecheni').mkdir(exist_ok=True)
    spisak = []
    for z in zadachi.values():
        rs = z['redove']
        produkti = sorted({p for r in rs if not r['skrit'] for p in r['produkti']})
        skrit = not produkti
        pdf = DOC / z['fail']
        id_ = Path(z['fail']).stem
        papka = produkti[0] if produkti else 'bez-produkt'
        # Езиковият филтър — за всички: и описаните като „EN" често са многоезични.
        tekst, en_str, prazni, n = izvleci(pdf, True)
        (DOC / 'izvlecheni' / f'{id_}.txt').write_text(tekst, encoding='utf8')
        grupa = next(i for i, g in enumerate(GRUPI) if re.search(g, papka))
        spisak.append({
            'id': id_,
            'original': z['kluch'],
            'fail': z['fail'],
            'bg_fail': f'bg-prevodi/{papka}/{id_}-bg.pdf',
            'zaglavia': sorted({r['zaglavie'] for r in rs}),
            'adres': rs[0]['adres'],
            'vid': rs[0]['vid'],
            'ezik': rs[0]['ezik'],
            'versiya': versiya(rs[0]['zaglavie'], tekst),
            'produkti': produkti,
            'produkti_imena': sorted({i for r in rs if not r['skrit'] for i in r.get('produkti_imena', [])}),
            'skrit': skrit,
            'stranici': n,
            'en_stranici': en_str,
            'znaci': len(tekst),
            'skaniran': not en_str,
            'prazni_stranici': prazni,
            '_red': (skrit, grupa, papka, rs[0]['vid'], id_),
        })
    spisak.sort(key=lambda x: x['_red'])
    for i, x in enumerate(spisak, 1):
        x['red'] = i
        del x['_red']
    out = D / 'prevodi' / 'spisak.json'
    out.parent.mkdir(exist_ok=True)
    out.write_text(json.dumps(spisak, ensure_ascii=False, indent=2) + '\n', encoding='utf8')
    vid = [x for x in spisak if not x['skrit']]
    sys.stdout.reconfigure(encoding='utf-8')
    print(f'за превод: {len(spisak)} (видими {len(vid)}, скрити {len(spisak) - len(vid)}); '
          f'знаци: видими {sum(x["znaci"] for x in vid)}, всички {sum(x["znaci"] for x in spisak)}; '
          f'сканирани: {[x["id"] for x in spisak if x["skaniran"]]}')


if __name__ == '__main__':
    main()
