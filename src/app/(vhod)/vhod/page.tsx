import { cookies } from 'next/headers'
import { notFound, redirect } from 'next/navigation'

import { VhodForm } from '@/components/VhodForm'
import { gateMode, isValidToken, safeNext } from '@/lib/gate'
import { getPayload } from 'payload'
import config from '@payload-config'

/**
 * `/vhod` — входът при заключен сайт. Влиза се с имейла и паролата за
 * админа (`POST /api/users/login`, същата бисквитка). Отключен сайт → 404.
 */
export const dynamic = 'force-dynamic'

const заключено = async () => {
  const mode = gateMode()
  if (mode !== 'setting') return mode === 'on'
  try {
    const payload = await getPayload({ config })
    const s = (await payload.findGlobal({ slug: 'site-settings', depth: 0, overrideAccess: true })) as {
      gate?: { locked?: boolean | null } | null
    }
    return s.gate?.locked !== false
  } catch {
    return true
  }
}

export default async function VhodPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  if (!(await заключено())) notFound()
  const next = safeNext((await searchParams).next)
  // Вече влязъл — направо където е тръгнал.
  if (await isValidToken((await cookies()).get('payload-token')?.value)) redirect(next)

  return (
    <main className="relative flex min-h-dvh items-center justify-center overflow-x-hidden bg-[#3a3d40] px-4 py-12">
      {/*
        Фонът (`task-vhod-dizayn.md`): наредените електроцентрали на EcoFlow —
        широката снимка на компютър, вертикалната (около DELTA и RIVER) на
        телефон; `scripts/vhod-snimki.mjs` ги прави от Медия.
      */}
      <picture>
        <source media="(max-width: 767px)" srcSet="/vhod/ecoflow-vhod-mob.webp" />
        <img src="/vhod/ecoflow-vhod.webp" alt="" className="absolute inset-0 size-full object-cover object-center" />
      </picture>
      {/* Затъмнение в два слоя — да се четат картата и текстът. */}
      <div
        aria-hidden="true"
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse at center, rgba(0,0,0,.25) 0%, rgba(0,0,0,.55) 100%), linear-gradient(to bottom, rgba(0,0,0,.35) 0%, rgba(0,0,0,.1) 50%, rgba(0,0,0,.45) 100%)',
        }}
      />
      <div className="relative flex w-full max-w-[400px] flex-col items-center">
        {/* Логото е тъмно — `brightness-0 invert` го прави чисто бяло. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/vhod/ecoflow-logo.png" alt="EcoFlow" width={190} height={23} className="mb-[22px] h-[22px] w-auto brightness-0 invert" />
        <div className="vhod-card w-full rounded-[20px] p-6 sm:p-8">
          <h1 className="text-2xl font-semibold leading-tight">Сайтът е в подготовка</h1>
          <p className="vhod-muted mt-2 text-sm leading-relaxed">Влезте с имейла и паролата си за админа.</p>
          <VhodForm next={next} />
        </div>
      </div>
      <p className="vhod-foot absolute inset-x-4 bottom-[18px] text-center text-xs">
        EcoFlow България · ДИ СИ 2008 ООД — официален дистрибутор
      </p>
    </main>
  )
}
