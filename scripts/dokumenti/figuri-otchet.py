"""
Отчет за фигурите в преводите (етап 5 на `task-dokumenti.md`).

    python scripts/dokumenti/figuri-otchet.py [--papka <папка с документите>]

За всеки видим документ с превод: фигурите в превода, областите, открити в оригинала
(`figuri/<id>/kandidati.json`), колко от тях са във фигурите и кои са изключени и защо
(`<!-- bez-figura … -->` в превода). → `content/dokumenti/figuri-otchet.csv` (в git).
"""
import csv
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(Path(__file__).parent))
from figuri import BEZ_RE, FIG_RE, papka  # noqa: E402

PREVODI = ROOT / 'content' / 'dokumenti' / 'prevodi'


def main():
    sys.stdout.reconfigure(encoding='utf-8')
    D = papka()
    redove = []
    for x in json.loads((PREVODI / 'spisak.json').read_text(encoding='utf8')):
        f = PREVODI / f"{x['id']}.md"
        if x['skrit'] or not f.exists():
            continue
        md = f.read_text(encoding='utf8')
        fig = [(int(m[1]), [int(v) for v in m.groups()[1:]]) for m in FIG_RE.finditer(md)]
        bez = [(int(m[1]), m[2] and (int(m[2]), int(m[3])), m[4].strip()) for m in BEZ_RE.finditer(md)]
        kf = D / 'figuri' / x['id'] / 'kandidati.json'
        kand = {int(k): v for k, v in json.loads(kf.read_text(encoding='utf8')).items()} if kf.exists() else {}
        oblasti = sum(len(v) for v in kand.values())
        izkl = []
        for n, spisuk in kand.items():
            for k in spisuk:
                prichina = next((p for s, t, p in bez if s == n and (not t or (k[0] <= t[0] <= k[2] and k[1] <= t[1] <= k[3]))), None)
                if prichina:
                    izkl.append(f'стр. {n}: {prichina}')
        redove.append({
            'документ': x['zaglavia'][0],
            'id': x['id'],
            'фигури в превода': len(fig),
            'области в оригинала': oblasti,
            'във фигурите': oblasti - len(izkl),
            'изключени': len(izkl),
            'изключени — защо': ' | '.join(izkl),
        })
    out = ROOT / 'content' / 'dokumenti' / 'figuri-otchet.csv'
    with out.open('w', encoding='utf-8-sig', newline='') as fh:
        w = csv.DictWriter(fh, fieldnames=list(redove[0]), delimiter=';')
        w.writeheader()
        w.writerows(redove)
    print(f'{len(redove)} документа; фигури {sum(r["фигури в превода"] for r in redove)}; '
          f'области {sum(r["области в оригинала"] for r in redove)}, изключени {sum(r["изключени"] for r in redove)} → {out}')


if __name__ == '__main__':
    main()
