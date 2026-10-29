/**
 * Документите (`task-dokumenti.md`) — видове, езици, редът и показването.
 * Общо за колекцията, продуктовата страница и `/dokumenti`.
 */

export const DOCUMENTS_PATH = '/dokumenti'

export const DOCUMENT_KINDS = [
  { label: 'Ръководство за потребителя', value: 'rakovodstvo' },
  { label: 'Кратко ръководство (Quick Start)', value: 'kratko' },
  { label: 'Инструкции за безопасност', value: 'bezopasnost' },
  { label: 'Ръководство за монтаж', value: 'montazh' },
  { label: 'Друго', value: 'drugo' },
] as const

/** Правилото: официален BG > превод > оригинал — и редът на показване. */
export const DOCUMENT_LANGUAGES = [
  { label: 'Български — официален (EcoFlow)', value: 'bg-oficialen' },
  { label: 'Български — превод (ДИ СИ 2008)', value: 'bg-prevod' },
  { label: 'Оригинал', value: 'original' },
] as const

export type DocumentKind = (typeof DOCUMENT_KINDS)[number]['value']
export type DocumentLanguage = (typeof DOCUMENT_LANGUAGES)[number]['value']

const KIND_ORDER: DocumentKind[] = ['rakovodstvo', 'kratko', 'bezopasnost', 'montazh', 'drugo']
const LANG_ORDER: DocumentLanguage[] = ['bg-oficialen', 'bg-prevod', 'original']

export const kindLabel = (k?: string | null) => DOCUMENT_KINDS.find((x) => x.value === k)?.label ?? 'Документ'

/** Кратък надпис за езика на картата. */
export const languageBadge = (l?: string | null, sourceLanguage?: string | null) =>
  l === 'bg-oficialen'
    ? 'Български · официален'
    : l === 'bg-prevod'
      ? 'Български · превод'
      : `Оригинал${sourceLanguage ? ` (${sourceLanguage})` : ''}`

/** Размер на файла: „2,4 MB" / „380 KB". */
export const formatSize = (bytes?: number | null) => {
  if (!bytes) return ''
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1).replace('.', ',')} MB`
}

export type DocItem = {
  id: number | string
  title: string
  kind: string
  language: string
  sourceLanguage?: string | null
  url: string
  filesize?: number | null
  original?: { url: string; sourceLanguage?: string | null } | null
}

/** Първо българските (официални, после преводи), после оригиналите; вътре — по вид, после по ред. */
export const sortDocuments = <T extends { kind?: string | null; language?: string | null }>(docs: T[]) =>
  [...docs].sort(
    (a, b) =>
      LANG_ORDER.indexOf(a.language as DocumentLanguage) - LANG_ORDER.indexOf(b.language as DocumentLanguage) ||
      KIND_ORDER.indexOf(a.kind as DocumentKind) - KIND_ORDER.indexOf(b.kind as DocumentKind),
  )
