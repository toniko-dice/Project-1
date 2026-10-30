"""
Етап 5 на `task-dokumenti.md` — схемите и снимките в преводите.

    python scripts/dokumenti/figuri.py kandidati <id> [<id> …]     [--papka <папка с документите>]
    python scripts/dokumenti/figuri.py proveri <id> <превод.md> <оригинал.en.md> [--papka …]

`kandidati` — фигурите на английските страници на оригинала (`spisak.json` → `en_stranici`),
открити автоматично: всичко, което не е текст (векторни пътища и снимки), се рендерира,
мастилото се групира в области; текстът вътре в областта (надписи, номера) влиза в нея.
Иконки под 45 pt (⚠, крушката на съвета) и линии се пропускат. → `<папка>/figuri/<id>/kandidati.json` и
`pregled-p<N>.png` (страницата с номерираните области — за преводача).

`proveri` — блоковете `:::figure p<стр> x0,y0,x1,y1` в превода и в `.en.md` (формат —
`content/dokumenti/prevodi/FORMAT.md`; координатите са в pt от горния ляв ъгъл):
  - еднакви са (брой, ред, области) в двата файла;
  - всяка фигура-кандидат на оригинала е покрита от фигура в превода, или е изключена
    изрично с `<!-- bez-figura p<стр> x,y: причина -->` (точка вътре в нея; напр. логото,
    таблица, преведена като таблица) или цялата страница — `<!-- bez-figura p<стр>: причина -->`
    → броят на фигурите съвпада с оригинала;
  - изрязва всяка фигура в `<папка>/figuri/<id>/`: снимка (една растерна картинка заема
    областта) — самата картинка от PDF-а, както я дава pdfimages; иначе (векторна схема) —
    изрязване от растеризираната страница.
Печата JSON: {ok, problemi, figuri: [{str, bbox, fail, shirina}], kandidati, izkliucheni}.
"""
import json
import re
import sys
from pathlib import Path

import pypdfium2 as pdfium
import pypdfium2.raw as raw
from PIL import Image, ImageDraw, ImageFilter

ROOT = Path(__file__).resolve().parents[2]
SPISAK = ROOT / 'content' / 'dokumenti' / 'prevodi' / 'spisak.json'

KLETKA = 3          # pt — решетката за мастилото
RAZSHIR = 4         # клетки (12 pt) — колко близо мастило е една фигура
MASTILO = 200       # яркост под това е мастило (светлите фонове и панели не са)
IKONKA = 45         # pt — по-малкото (и по двете страни) е иконка (⚠, крушката на съвета), не фигура
MASHTAB = 2.5       # изрязването: 180 dpi
FIG_RE = re.compile(r'^:::figure\s+p(\d+)\s+(-?\d+),\s*(-?\d+),\s*(-?\d+),\s*(-?\d+)\s*$', re.M)
BEZ_RE = re.compile(r'<!--\s*bez-figura\s+p(\d+)(?:\s+(\d+),\s*(\d+))?\s*:([^>]*)-->')


def papka():
    if '--papka' in sys.argv:
        return Path(sys.argv[sys.argv.index('--papka') + 1])
    return ROOT / 'content' / 'dokumenti'


def zapis(doc_id):
    for x in json.loads(SPISAK.read_text(encoding='utf8')):
        if x['id'] == doc_id:
            return x
    raise SystemExit(f'няма „{doc_id}" в spisak.json')


def obekti(page, vid):
    """Обектите от вида (с вложените във форми) → правоъгълници в pt от горния ляв ъгъл."""
    l, b, r, t = page.get_cropbox()
    out = []
    for o in page.get_objects(max_depth=6):
        if o.type == vid:
            x0, y0, x1, y1 = o.get_bounds()
            out.append(((x0 - l, t - y1, x1 - l, t - y0), o))
    return out


def kandidati_str(page):
    w, h = page.get_size()
    tekst = [r for r, _ in obekti(page, raw.FPDF_PAGEOBJ_TEXT)]
    img = page.render(scale=1, grayscale=True).to_pil().convert('L')
    d = ImageDraw.Draw(img)
    for x0, y0, x1, y1 in tekst:
        d.rectangle([x0, y0, x1, y1], fill=255)
    gw, gh = -(-img.width // KLETKA), -(-img.height // KLETKA)
    mast = img.point(lambda v: 255 if v < MASTILO else 0).resize((gw, gh), Image.BOX).point(lambda v: 255 if v else 0)
    shir = mast.filter(ImageFilter.MaxFilter(2 * RAZSHIR + 1))
    m, s = mast.tobytes(), shir.tobytes()
    etiket = [0] * len(s)
    oblasti = []
    for start in range(len(s)):
        if not s[start] or etiket[start]:
            continue
        n = len(oblasti) + 1
        etiket[start] = n
        stek, kl = [start], []
        while stek:
            i = stek.pop()
            if m[i]:
                kl.append(i)
            x, y = i % gw, i // gw
            for j in ((i - 1) if x else -1, (i + 1) if x < gw - 1 else -1, i - gw, i + gw):
                if 0 <= j < len(s) and s[j] and not etiket[j]:
                    etiket[j] = n
                    stek.append(j)
        oblasti.append(kl)
    kand = []
    for kl in oblasti:
        if not kl:
            continue
        xs = [i % gw for i in kl]
        ys = [i // gw for i in kl]
        bb = [min(xs) * KLETKA, min(ys) * KLETKA, (max(xs) + 1) * KLETKA, (max(ys) + 1) * KLETKA]
        bw, bh = bb[2] - bb[0], bb[3] - bb[1]
        if (bw < IKONKA and bh < IKONKA) or bw < 8 or bh < 8:
            continue
        # Надписите и номерата около фигурата: текст, който е почти целият до нея.
        e = [bb[0] - 10, bb[1] - 10, bb[2] + 10, bb[3] + 10]
        for x0, y0, x1, y1 in tekst:
            ix = max(0, min(x1, e[2]) - max(x0, e[0])) * max(0, min(y1, e[3]) - max(y0, e[1]))
            if ix >= 0.8 * max(1e-6, (x1 - x0) * (y1 - y0)):
                bb = [min(bb[0], x0), min(bb[1], y0), max(bb[2], x1), max(bb[3], y1)]
        kand.append([max(0, bb[0]), max(0, bb[1]), min(w, bb[2]), min(h, bb[3])])
    # Застъпващите се — една.
    slyato = True
    while slyato:
        slyato = False
        for i in range(len(kand)):
            for j in range(i + 1, len(kand)):
                a, b = kand[i], kand[j]
                if a[0] < b[2] and b[0] < a[2] and a[1] < b[3] and b[1] < a[3]:
                    kand[i] = [min(a[0], b[0]), min(a[1], b[1]), max(a[2], b[2]), max(a[3], b[3])]
                    del kand[j]
                    slyato = True
                    break
            if slyato:
                break
    kand.sort(key=lambda b: (round(b[1] / 40), b[0]))
    return [[round(v) for v in b] for b in kand]


def kandidati(doc_id):
    x = zapis(doc_id)
    D = papka()
    out = D / 'figuri' / doc_id
    out.mkdir(parents=True, exist_ok=True)
    pdf = pdfium.PdfDocument(D / x['fail'])
    rez = {}
    for n in x['en_stranici']:
        page = pdf[n - 1]
        kand = kandidati_str(page)
        rez[n] = kand
        sc = 1.5
        im = page.render(scale=sc).to_pil().convert('RGB')
        d = ImageDraw.Draw(im)
        for k, b in enumerate(kand, 1):
            d.rectangle([v * sc for v in b], outline=(230, 0, 0), width=3)
            d.rectangle([b[0] * sc, b[1] * sc, b[0] * sc + 120, b[1] * sc + 22], fill=(230, 0, 0))
            d.text((b[0] * sc + 4, b[1] * sc + 4), f'k{k} {b[0]},{b[1]},{b[2]},{b[3]}', fill=(255, 255, 255))
        im.save(out / f'pregled-p{n}.png')
    (out / 'kandidati.json').write_text(json.dumps(rez, ensure_ascii=False, indent=1), encoding='utf8')
    obshto = sum(len(v) for v in rez.values())
    print(f'{doc_id}: {obshto} кандидата на {len(rez)} стр. → {out}')


def izrezhi(pdf, n, bb, out):
    """Снимка, която заема областта → картинката от PDF-а; иначе — изрязване от страницата."""
    page = pdf[n - 1]
    w, h = page.get_size()
    plosht = max(1, (bb[2] - bb[0]) * (bb[3] - bb[1]))
    for r, o in obekti(page, raw.FPDF_PAGEOBJ_IMAGE):
        ix = max(0, min(r[2], bb[2]) - max(r[0], bb[0])) * max(0, min(r[3], bb[3]) - max(r[1], bb[1]))
        pr = max(1, (r[2] - r[0]) * (r[3] - r[1]))
        if ix >= 0.85 * plosht and ix >= 0.85 * pr:
            try:
                im = o.get_bitmap(render=True).to_pil().convert('RGB')
            except Exception:
                break
            f = out.with_suffix('.jpg')
            im.save(f, quality=88)
            return f, 'snimka'
    l, b, r, t = page.get_cropbox()
    im = page.render(scale=MASHTAB, crop=(bb[0], h - bb[3], w - bb[2], bb[1])).to_pil().convert('RGB')
    # Схемите са сиви — по-малък файл без загуба на четливост.
    sivo = all(abs(px[0] - px[1]) < 12 and abs(px[1] - px[2]) < 12 for px in zip(*[iter(im.resize((64, 64)).tobytes())] * 3))
    im = im.convert('L') if sivo else im.quantize(256)
    f = out.with_suffix('.png')
    im.save(f, optimize=True)
    return f, 'shema'


def proveri(doc_id, bg_md, en_md):
    x = zapis(doc_id)
    D = papka()
    bg = Path(bg_md).read_text(encoding='utf8')
    en = Path(en_md).read_text(encoding='utf8')
    problemi = []
    fb = [(int(m[1]), [int(v) for v in m.groups()[1:]]) for m in FIG_RE.finditer(bg)]
    fe = [(int(m[1]), [int(v) for v in m.groups()[1:]]) for m in FIG_RE.finditer(en)]
    for t, ime in ((bg, 'превода'), (en, '.en.md')):
        losh = [l for l in re.findall(r'^:::figure.*$', t, re.M) if not FIG_RE.match(l)]
        if losh:
            problemi.append(f'неразпознат ред на фигура в {ime}: {losh[0]}')
    if fb != fe:
        problemi.append(f'фигурите в превода ({len(fb)}) и в .en.md ({len(fe)}) не са едни и същи')
    if re.search(r'в оригинала\)', bg):
        problemi.append('останала препратка „(вижте … в оригинала)" — фигурата трябва да е в превода')
    bez = [(int(m[1]), int(m[2]), int(m[3]), m[4].strip()) for m in BEZ_RE.finditer(bg) if m[2]]
    bez_str = {int(m[1]) for m in BEZ_RE.finditer(bg) if not m[2]}
    kf = D / 'figuri' / doc_id / 'kandidati.json'
    if not kf.exists():
        kandidati(doc_id)
    kand = {int(k): v for k, v in json.loads(kf.read_text(encoding='utf8')).items()}
    izkl = 0
    for n, spisuk in kand.items():
        for k in spisuk:
            if n in bez_str or any(p == n and k[0] <= px <= k[2] and k[1] <= py <= k[3] for p, px, py, _ in bez):
                izkl += 1
                continue
            plosht = max(1, (k[2] - k[0]) * (k[3] - k[1]))
            pokrito = sum(max(0, min(k[2], f[2]) - max(k[0], f[0])) * max(0, min(k[3], f[3]) - max(k[1], f[1]))
                          for p, f in fb if p == n)
            if pokrito < 0.6 * plosht:
                problemi.append(f'фигура от оригинала липсва в превода: стр. {n}, {k[0]},{k[1]},{k[2]},{k[3]}')
    for p, px, py, _ in bez:
        if not any(k[0] <= px <= k[2] and k[1] <= py <= k[3] for k in kand.get(p, [])):
            problemi.append(f'„bez-figura p{p} {px},{py}" не сочи фигура от оригинала')
    for p, f in fb:
        if p not in kand:
            problemi.append(f'фигура на стр. {p} — не е английска страница на оригинала')
        if f[2] <= f[0] or f[3] <= f[1]:
            problemi.append(f'празна област на фигура: стр. {p}, {f}')
    figuri = []
    if not problemi:
        pdf = pdfium.PdfDocument(D / x['fail'])
        out = D / 'figuri' / doc_id
        for p, f in fb:
            fail, vid = izrezhi(pdf, p, f, out / f'p{p}-{f[0]}-{f[1]}-{f[2]}-{f[3]}')
            # Ширината — като в отпечатания оригинал, малко по-едро (A4: 516 pt между полетата);
            # еднакъв мащаб между фигурите.
            figuri.append({'str': p, 'bbox': f, 'fail': str(fail), 'vid': vid,
                           'shirina': round(min(100, max(30, (f[2] - f[0]) * 1.3 / 516 * 100)))})
    print(json.dumps({'ok': not problemi, 'problemi': problemi, 'figuri': figuri,
                      'kandidati': sum(len(v) for v in kand.values()), 'izkliucheni': izkl}, ensure_ascii=False))


def main():
    sys.stdout.reconfigure(encoding='utf-8')
    a = [x for i, x in enumerate(sys.argv[1:], 1) if x != '--papka' and sys.argv[i - 1] != '--papka']
    if a and a[0] == 'kandidati':
        for doc_id in a[1:]:
            kandidati(doc_id)
    elif a and a[0] == 'proveri' and len(a) == 4:
        proveri(*a[1:])
    else:
        raise SystemExit(__doc__)


if __name__ == '__main__':
    main()
