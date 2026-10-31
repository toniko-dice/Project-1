"""Видимите продукти без раздел „Документи" — по живия сайт (task-dokumenti-lipsvashti.md).

  python -I -X utf8 scripts/dokumenti/bez-dokumenti.py [<сайт>] [--tsv <файл>]

Взима адресите `/kategorii/<категория>/<продукт>` от sitemap.xml, отваря всеки и
гледа дали е продукт (JSON-LD „Product") и дали има `id="dokumenti"`. Печата
„адрес | име" на продуктите без раздела и броя; с `--tsv` — и във файл.
"""
import html
import re
import sys
import urllib.request
from concurrent.futures import ThreadPoolExecutor

args = [a for a in sys.argv[1:]]
tsv = None
if '--tsv' in args:
    i = args.index('--tsv')
    tsv = args[i + 1]
    del args[i:i + 2]
SITE = (args[0] if args else 'https://ecoflow.bg').rstrip('/')
UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) ecoflow-bg-proverka'


def get(url):
    req = urllib.request.Request(url, headers={'User-Agent': UA})
    with urllib.request.urlopen(req, timeout=60) as r:
        return r.read().decode('utf8', 'replace')


def proveri(url):
    s = get(url)
    if '"@type":"Product"' not in s:
        return None
    h1 = re.search(r'<h1[^>]*>(.*?)</h1>', s, re.S)
    ime = html.unescape(re.sub(r'<[^>]+>', '', h1.group(1))).strip() if h1 else ''
    return url.replace(SITE, ''), ime, 'id="dokumenti"' in s


adresi = [a for a in re.findall(r'<loc>([^<]+)</loc>', get(f'{SITE}/sitemap.xml'))
          if re.search(r'/kategorii/[^/]+/[^/]+$', a)]
with ThreadPoolExecutor(6) as ex:
    rezultati = [r for r in ex.map(proveri, adresi) if r]
bez = sorted((a, i) for a, i, ima in rezultati if not ima)
for a, i in bez:
    print(f'{a} | {i}')
print(f'продукти: {len(rezultati)}, с „Документи": {len(rezultati) - len(bez)}, без: {len(bez)}')
if tsv:
    with open(tsv, 'w', encoding='utf8') as f:
        f.writelines(f'{a}\t{i}\n' for a, i in bez)
