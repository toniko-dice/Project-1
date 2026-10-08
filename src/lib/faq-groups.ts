/**
 * Групите на `/vaprosi` (`task-vaprosi-lenta-6-grupi.md`) — ЕДИНСТВЕНОТО място,
 * където се решава кой въпрос къде отива. Смяна на групите = промяна тук.
 *
 * Група → подгрупи → slug-ове на категории (`categories`) и/или на страници
 * (`pages`). Въпросът от продукт отива в първата подгрупа (по реда тук),
 * чиито категории съдържат основната категория на продукта или категория
 * над нея. Въпрос от страница — по slug-а на страницата.
 *
 * Подгрупа с празно `title` няма H3 (групата е само тя). Нищо неразпознато
 * → група с `fallback: true`, подгрупа с името на основната категория (или
 * на страницата).
 *
 * Еднакъв въпрос (без главни букви и препинателни знаци) се показва само
 * веднъж — в първата група и подгрупа по този ред.
 */
export type FaqSubgroupConfig = {
  /** Котвата на подгрупата — `#<група>-<id>`; празно при единствена подгрупа. */
  id: string
  title: string
  categories?: string[]
  pages?: string[]
}

export type FaqGroupConfig = {
  /** Котвата в лентата: `/vaprosi#delta-seriya`. */
  id: string
  title: string
  subgroups: FaqSubgroupConfig[]
  /** Тук отиват въпросите, които не попадат никъде другаде. */
  fallback?: boolean
}

export const FAQ_GROUPS: FaqGroupConfig[] = [
  { id: 'delta-seriya', title: 'DELTA серия', subgroups: [{ id: '', title: '', categories: ['delta-seriya'] }] },
  { id: 'river-seriya', title: 'RIVER серия', subgroups: [{ id: '', title: '', categories: ['river-seriya'] }] },
  {
    id: 'solarni-paneli',
    title: 'Соларни панели',
    subgroups: [
      { id: 'stream', title: 'Системи STREAM', categories: ['stream-seriya'] },
      { id: 'mikroinvertori', title: 'Микроинвертори и монтаж за балкон', categories: ['mikroinvertori-i-montazh'] },
      { id: 'stacionarni', title: 'Стационарни панели', categories: ['stacionarni-paneli'] },
      { id: 'sgavaemi', title: 'Сгъваеми панели', categories: ['sgavaemi-paneli'] },
    ],
  },
  { id: 'wave-klimatik', title: 'Wave климатик', subgroups: [{ id: '', title: '', categories: ['wave-klimatici'] }] },
  { id: 'glacier-hladilnik', title: 'Glacier хладилник', subgroups: [{ id: '', title: '', categories: ['glacier-hladilnici'] }] },
  {
    id: 'obshti-vaprosi',
    title: 'Общи въпроси',
    fallback: true,
    subgroups: [
      {
        id: 'elektrocentrali',
        title: 'Портативни електроцентрали — общи въпроси',
        pages: ['rakovodstvo-portativni-elektrocentrali'],
      },
      { id: 'rapid', title: 'Външни батерии RAPID', categories: ['vanshni-baterii-rapid', 'vanshni-baterii'] },
      { id: 'zaryadni', title: 'Зарядни устройства', categories: ['zaryadni-ustroystva'] },
      { id: 'dopalnitelni-baterii', title: 'Допълнителни батерии', categories: ['dopalnitelni-baterii'] },
      { id: 'oferti', title: 'Оферти за фирми', pages: ['oferta-za-firmi'] },
    ],
  },
]
