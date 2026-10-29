import type { Metadata } from 'next'

import { Breadcrumbs, breadcrumbSchema, type Crumb } from '@/components/Breadcrumbs'
import { DocumentsExplorer, type ExplorerDoc } from '@/components/DocumentsExplorer'
import { DOCUMENTS_PATH, sortDocuments } from '@/lib/documents'
import { mediaUrl } from '@/lib/media'
import { getAllDocuments, getCategoryTree, getGlobal } from '@/lib/payload'
import { absoluteUrl } from '@/lib/site-url'
import { finalTitle, pageTitle, SITE_NAME } from '@/lib/title'
import { ancestry, byId } from '@/lib/tree'

/**
 * „Документи" (`task-dokumenti.md`) — всички видими ръководства на EcoFlow:
 * официалните на български, преводите и оригиналите. Код, не запис в
 * „Страници"; данните — колекцията „Документи".
 */
const H1 = 'Документи и ръководства'
const DESCRIPTION =
  'Ръководства за потребителя, кратки ръководства, инструкции за безопасност и за монтаж на продуктите EcoFlow — на български и в оригинал, за изтегляне в PDF.'

export const generateMetadata = async (): Promise<Metadata> => {
  const header = await getGlobal('header')
  const url = absoluteUrl(DOCUMENTS_PATH)
  const logo = mediaUrl((header as { logo?: unknown }).logo as never)
  return {
    title: pageTitle(H1),
    description: DESCRIPTION,
    alternates: { canonical: url },
    openGraph: {
      title: finalTitle(H1),
      description: DESCRIPTION,
      url,
      type: 'website',
      locale: 'bg_BG',
      siteName: SITE_NAME,
      ...(logo ? { images: [{ url: absoluteUrl(logo) }] } : {}),
    },
  }
}

export default async function DocumentsPage() {
  const [docs, tree] = await Promise.all([getAllDocuments(), getCategoryTree()])
  const map = byId(tree)

  // Категория (горното ниво) и серия (второто) на всеки документ — от продуктите му.
  const категории = new Map<string, string>()
  const серии = new Map<string, { label: string; category: string }>()
  const items: ExplorerDoc[] = sortDocuments(docs).map((d) => {
    const cats = new Set<string>()
    const sers = new Set<string>()
    for (const p of d.products) {
      const c = p.categoryId ? map.get(p.categoryId as number) : undefined
      if (!c) continue
      const път = ancestry(tree, c)
      const главна = път[0]
      const серия = път[1]
      if (главна) {
        cats.add(главна.slug)
        категории.set(главна.slug, главна.title)
      }
      if (серия && главна) {
        sers.add(серия.slug)
        серии.set(серия.slug, { label: серия.title, category: главна.slug })
      }
    }
    return { ...d, products: d.products.map((p) => ({ title: p.title, path: p.path })), categories: [...cats], series: [...sers] }
  })

  const ред = new Map(tree.map((c, i) => [c.slug, i]))
  const byOrder = (a: string, b: string) => (ред.get(a) ?? 0) - (ред.get(b) ?? 0)
  const crumbs: Crumb[] = [
    { label: 'Начало', url: '/' },
    { label: H1, url: DOCUMENTS_PATH },
  ]

  return (
    <div className="bg-surface">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema(crumbs)) }} />
      <div className="container-site pt-6">
        <Breadcrumbs items={crumbs} />
      </div>
      <div className="container-site pb-16 pt-6 lg:pt-8">
        <div className="mx-auto max-w-[56rem]">
          <h1 className="text-3xl font-semibold tracking-tight sm:text-[40px] sm:leading-tight">{H1}</h1>
          <p className="mt-3 text-base leading-relaxed text-ink-muted">
            Ръководствата на EcoFlow за продуктите в сайта. Първо са официалните на български, после преводите на ДИ СИ
            2008 ООД, после оригиналите. При разлики между превод и оригинал важи оригиналът.
          </p>
          <div className="mt-8">
            <DocumentsExplorer
              docs={items}
              categories={[...категории.keys()].sort(byOrder).map((v) => ({ value: v, label: категории.get(v)! }))}
              series={[...серии.keys()].sort(byOrder).map((v) => ({ value: v, ...серии.get(v)! }))}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
