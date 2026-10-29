"""
Етап 7 на `task-dokumenti.md` — всичко при собственика в един ZIP.

    python scripts/dokumenti/zip.py [<папка с документите>]

`<папка>/EcoFlow-dokumenti-<дата>.zip` със същата структура като папката:
`originali/`, `bg-oficialni/` (с `izvadki/`), `bg-prevodi/`, `opis.csv` (колоните
„файл" и „файл на български" са пътищата в ZIP-а — `opis.py`). Проверява, че
всеки файл от `opis.csv` е в ZIP-а. ZIP-ът не е в git.
"""
import csv
import datetime
import sys
import zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
DOC = Path(sys.argv[1]) if len(sys.argv) > 1 else ROOT / 'content' / 'dokumenti'


def main():
    sys.stdout.reconfigure(encoding='utf-8')
    out = DOC / f'EcoFlow-dokumenti-{datetime.date.today().isoformat()}.zip'
    imena = []
    for papka in ('originali', 'bg-oficialni', 'bg-prevodi'):
        imena += sorted(p.relative_to(DOC).as_posix() for p in (DOC / papka).rglob('*.pdf'))
    imena.append('opis.csv')
    # PDF-ите вече са компресирани — без повторно компресиране (по-бързо, почти същият размер).
    with zipfile.ZipFile(out, 'w', zipfile.ZIP_STORED) as z:
        for ime in imena:
            z.write(DOC / ime, ime)
    with zipfile.ZipFile(out) as z:
        v_zip = set(z.namelist())
    redove = list(csv.DictReader((DOC / 'opis.csv').open(encoding='utf-8-sig'), delimiter=';'))
    lipsvat = sorted({r[k] for r in redove for k in ('файл', 'файл на български') if r.get(k) and r[k] not in v_zip})
    if lipsvat:
        raise SystemExit(f'липсват в ZIP-а: {lipsvat[:10]}')
    print(f'✓ {out.name}: {len(imena)} файла, {out.stat().st_size / 1048576:.0f} MB; всички файлове от opis.csv са вътре')


if __name__ == '__main__':
    main()
