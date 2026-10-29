import { DownloadSimple, FilePdf } from '@phosphor-icons/react/dist/ssr'

import { type DocItem, formatSize, kindLabel, languageBadge } from '@/lib/documents'

/**
 * Списък документи (`task-dokumenti.md`) — продуктовата страница и `/dokumenti`.
 * За всеки: иконка PDF, заглавие, вид, език, размер, „Изтегли"; при превод —
 * под него малко „Оригинал (EN)". Редът идва отвън (`sortDocuments`).
 */
export const DocumentRow = ({ doc, extra }: { doc: DocItem; extra?: React.ReactNode }) => (
  <li className="flex items-start gap-4 px-4 py-4 sm:px-5">
    <FilePdf aria-hidden size={32} weight="light" className="mt-0.5 shrink-0 text-ink-muted" />
    <div className="min-w-0 flex-1">
      <a href={doc.url} target="_blank" rel="noopener" className="font-medium text-ink underline-offset-4 hover:underline [overflow-wrap:anywhere]">
        {doc.title}
      </a>
      <p className="mt-1 text-[13px] text-ink-muted">
        {[kindLabel(doc.kind), languageBadge(doc.language, doc.sourceLanguage), `PDF${doc.filesize ? ` · ${formatSize(doc.filesize)}` : ''}`].join(' · ')}
      </p>
      {doc.language === 'bg-prevod' && doc.original?.url ? (
        <p className="mt-1 text-[13px]">
          <a href={doc.original.url} target="_blank" rel="noopener" className="text-ink-muted underline underline-offset-4 hover:text-ink">
            Оригинал{doc.original.sourceLanguage ? ` (${doc.original.sourceLanguage})` : ''}
          </a>
        </p>
      ) : null}
      {extra}
    </div>
    <a
      href={doc.url}
      download
      className="inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-full border border-line px-4 text-sm font-medium text-ink transition-colors hover:border-ink"
      aria-label={`Изтегли: ${doc.title}`}
    >
      <DownloadSimple aria-hidden size={18} />
      <span className="max-sm:sr-only">Изтегли</span>
    </a>
  </li>
)

export const DocumentList = ({ docs }: { docs: DocItem[] }) => (
  <ul className="divide-y divide-line overflow-hidden rounded-lg border border-line bg-surface">
    {docs.map((d) => (
      <DocumentRow key={d.id} doc={d} />
    ))}
  </ul>
)
