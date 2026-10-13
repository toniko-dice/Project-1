import { cookiesOf, shownCategories } from '@/lib/consent'

import { CookieSettingsButton } from './CookieSettingsButton'

/**
 * „Бисквитки, които използваме" на `/biskvitki` (`task-banner-biskvitki.md`,
 * т. 7) — от `src/lib/consent.ts`, същото като в настройките на банера.
 * Излиза при отметка „Таблица с бисквитките" на страницата — не е текст,
 * затова не остарява и вносът не може да я изтрие.
 */
export const CookieTable = () => (
  <section aria-labelledby="biskvitki-tablica" className="container-site max-w-[760px] pb-16">
    <h2 id="biskvitki-tablica" className="text-2xl font-semibold">
      Бисквитки, които използваме
    </h2>
    {shownCategories().map((k) => {
      const списък = cookiesOf(k.id)
      return (
        <div key={k.id} className="mt-6">
          <h3 className="text-lg font-semibold">{k.title}</h3>
          <p className="mt-1 text-sm leading-relaxed text-ink-muted">{k.description}</p>
          {списък.length ? (
            <div className="mt-3 overflow-x-auto rounded-lg border border-line">
              <table className="w-full min-w-[520px] text-left text-sm">
                <thead className="bg-tile text-ink-muted">
                  <tr>
                    <th className="px-3 py-2 font-medium">Име</th>
                    <th className="px-3 py-2 font-medium">Доставчик</th>
                    <th className="px-3 py-2 font-medium">Цел</th>
                    <th className="px-3 py-2 font-medium">Срок</th>
                  </tr>
                </thead>
                <tbody>
                  {списък.map((c) => (
                    <tr key={c.name} className="border-t border-line align-top">
                      <td className="px-3 py-2 font-mono text-xs">{c.name}</td>
                      <td className="px-3 py-2">{c.provider}</td>
                      <td className="px-3 py-2">
                        {c.purpose}
                        {c.note ? <span className="text-ink-muted"> ({c.note})</span> : null}
                      </td>
                      <td className="whitespace-nowrap px-3 py-2">{c.duration}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="mt-3 text-sm text-ink-muted">В момента сайтът не използва такива бисквитки.</p>
          )}
        </div>
      )
    })}
    <div className="mt-8">
      <CookieSettingsButton />
    </div>
  </section>
)
