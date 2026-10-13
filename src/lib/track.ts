/**
 * Google Analytics 4 + Consent Mode v2 (`task-banner-biskvitki.md`, т. 6) —
 * подготовка: GA4 още няма ID.
 *
 * - `NEXT_PUBLIC_GA_ID` празно → нищо от Google не се зарежда никога.
 * - С ID: в `<head>` има само `gtag('consent','default', …всичко denied…)`
 *   (`CONSENT_DEFAULT_SCRIPT`, в layout-а) — без заявка към Google.
 *   Скриптът `gtag/js` се зарежда ЕДВА след съгласие за „Аналитични"
 *   (basic consent mode — по-строгият вариант, препоръчван за ЕС).
 * - `track(event, params)` праща само при съгласие; иначе не прави нищо.
 *
 * Изборът идва от банера (`CookieConsent`) през `applyConsent`.
 */
import type { ConsentChoices } from './consent'

export const GA_ID = process.env.NEXT_PUBLIC_GA_ID?.trim() || ''

type Gtag = (...args: unknown[]) => void
type W = Window & { dataLayer?: unknown[]; gtag?: Gtag; __gaLoaded?: boolean; __consent?: ConsentChoices }

/** За `<head>` — преди всеки Google скрипт. Рендерира се само при `GA_ID`. */
export const CONSENT_DEFAULT_SCRIPT = `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}window.gtag=gtag;gtag('consent','default',{ad_storage:'denied',ad_user_data:'denied',ad_personalization:'denied',analytics_storage:'denied',functionality_storage:'granted',security_storage:'granted',wait_for_update:500});`

const w = () => window as W

const gtag: Gtag = (...args) => {
  const win = w()
  win.dataLayer = win.dataLayer || []
  if (!win.gtag) {
    win.gtag = function () {
      // eslint-disable-next-line prefer-rest-params
      win.dataLayer!.push(arguments)
    }
  }
  win.gtag(...args)
}

/** Прилага избора: Consent Mode `update` и — при съгласие — зарежда GA4. */
export const applyConsent = (c: ConsentChoices) => {
  w().__consent = c
  if (!GA_ID) return
  gtag('consent', 'update', {
    analytics_storage: c.analytics ? 'granted' : 'denied',
    ad_storage: c.marketing ? 'granted' : 'denied',
    ad_user_data: c.marketing ? 'granted' : 'denied',
    ad_personalization: c.marketing ? 'granted' : 'denied',
  })
  if (c.analytics && !w().__gaLoaded) {
    w().__gaLoaded = true
    const s = document.createElement('script')
    s.async = true
    s.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(GA_ID)}`
    document.head.appendChild(s)
    gtag('js', new Date())
    gtag('config', GA_ID)
  }
}

/** Зареден ли е скриптът на Google — тогава оттеглянето иска презареждане, за да спре. */
export const gaLoaded = () => Boolean(w().__gaLoaded)

/** Събитие към аналитиката — САМО при съгласие и ID. */
export const track = (event: string, params: Record<string, unknown> = {}) => {
  if (typeof window === 'undefined' || !GA_ID || !w().__consent?.analytics) return
  gtag('event', event, params)
}
