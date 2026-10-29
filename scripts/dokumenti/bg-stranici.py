"""
Етап 5 на `task-dokumenti.md` — българските страници в многоезичните оригинали.

    python scripts/dokumenti/bg-stranici.py [<папка с документите>]

Много PDF-и на EcoFlow (инструкции за безопасност, кратки ръководства) имат и
официален български текст. Той е „официален BG" и стои преди нашия превод.
За всеки оригинал от `svaleni.json`: страниците с български текст (кирилица +
чести български думи, без руските „ы", „э", „ё") → `<папка>/bg-stranici.json`
{sha256: {"fail", "stranici": [..], "znaci": N}}; на екрана — списъкът.
"""
import json
import re
import shutil
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
DOC = Path(sys.argv[1]) if len(sys.argv) > 1 else ROOT / 'content' / 'dokumenti'
PDFTOTEXT = shutil.which('pdftotext') or 'pdftotext'
BG = set('и на за се от да не с в е по при или към продукта продукт използвайте устройството ако може това са които'.split())
RU = re.compile(r'[ыэё]', re.I)


def stranici(pdf: Path):
    import pypdfium2
    n = len(pypdfium2.PdfDocument(str(pdf)))
    out = []
    for p in range(1, n + 1):
        t = subprocess.run([PDFTOTEXT, '-enc', 'UTF-8', '-f', str(p), '-l', str(p), str(pdf), '-'], capture_output=True).stdout.decode('utf8', 'replace')
        for abz in re.split(r'\n\s*\n', t):
            dumi = re.findall(r'[а-яъь]+', abz.lower())
            if len(dumi) < 8:
                continue
            ru = len(RU.findall(abz))
            bg = sum(1 for d in dumi if d in BG)
            # Българският има „ъ" в средата на думите и не използва ы/э/ё.
            if ru == 0 and bg >= 3 and sum(1 for d in dumi if 'ъ' in d[:-1]) >= 1:
                out.append((p, len(abz)))
                break
    return n, out


def main():
    svaleni = json.loads((DOC / 'svaleni.json').read_text(encoding='utf8'))
    rez = {}
    for s in {v['sha256']: v for v in svaleni.values()}.values():
        n, st = stranici(DOC / s['fail'])
        if st:
            rez[s['sha256']] = {'fail': s['fail'], 'stranici': [p for p, _ in st], 'ot': n}
    (DOC / 'bg-stranici.json').write_text(json.dumps(rez, ensure_ascii=False, indent=2) + '\n', encoding='utf8')
    sys.stdout.reconfigure(encoding='utf-8')
    for v in sorted(rez.values(), key=lambda v: v['fail']):
        print(f"{v['fail']}: стр. {v['stranici']} от {v['ot']}")
    print(f'с български: {len(rez)} от {len({v["sha256"] for v in svaleni.values()})}')


if __name__ == '__main__':
    main()
