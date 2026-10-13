'use client'

import { CONSENT_OPEN_EVENT } from '@/lib/consent'

/** Отваря настройките на бисквитките (`CookieConsent`) — за оттегляне или промяна на избора. */
export const CookieSettingsButton = () => (
  <button
    type="button"
    onClick={() => window.dispatchEvent(new Event(CONSENT_OPEN_EVENT))}
    className="inline-flex min-h-11 cursor-pointer items-center justify-center rounded-md border border-ink bg-surface px-5 text-sm font-semibold text-ink transition-colors duration-200 hover:bg-tile"
  >
    Настройки на бисквитките
  </button>
)
