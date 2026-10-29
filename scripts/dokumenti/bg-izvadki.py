"""
Етап 5 на `task-dokumenti.md` — официалният български текст от многоезичен оригинал.

    python scripts/dokumenti/bg-izvadki.py [<папка с документите>]

Някои многоезични PDF-и на EcoFlow имат и българска част (намира ги
`bg-stranici.py`). Тя е „официален BG" — текстът на EcoFlow — и стои преди
нашия превод. `content/dokumenti/bg-izvadki.json` (в git; решението кои
страници) → страниците, извадени без промяна, в
`<папка>/bg-oficialni/izvadki/<id>-bg.pdf`; SHA-256 на оригинала се попълва в
json-а. Вносът (`src/import-dokumenti.ts`) ги внася като „официален BG".
"""
import hashlib
import json
import sys
from pathlib import Path

import pypdfium2

ROOT = Path(__file__).resolve().parents[2]
CFG = ROOT / 'content' / 'dokumenti' / 'bg-izvadki.json'
DOC = Path(sys.argv[1]) if len(sys.argv) > 1 else ROOT / 'content' / 'dokumenti'


def main():
    cfg = json.loads(CFG.read_text(encoding='utf8'))
    sys.stdout.reconfigure(encoding='utf-8')
    for id_, z in cfg.items():
        src = DOC / z['fail']
        z['sha256'] = hashlib.sha256(src.read_bytes()).hexdigest()
        orig = pypdfium2.PdfDocument(str(src))
        nov = pypdfium2.PdfDocument.new()
        nov.import_pages(orig, [p - 1 for p in z['stranici']])
        out = DOC / 'bg-oficialni' / 'izvadki' / f'{id_}-bg.pdf'
        out.parent.mkdir(parents=True, exist_ok=True)
        nov.save(str(out))
        print(f'✓ {id_}: стр. {z["stranici"]} → {out.relative_to(DOC)}')
    CFG.write_text(json.dumps(cfg, ensure_ascii=False, indent=2) + '\n', encoding='utf8')


if __name__ == '__main__':
    main()
