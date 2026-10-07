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
    <main className="relative flex min-h-dvh items-center justify-center px-4 py-10">
      <picture>
        <source media="(max-width: 767px)" srcSet="/vhod/ecoflow-vhod-mob.webp" />
        <img src="/vhod/ecoflow-vhod.webp" alt="" className="absolute inset-0 size-full object-cover" />
      </picture>
      <div className="absolute inset-0 bg-black/45" aria-hidden="true" />
      <div className="relative w-full max-w-[400px] rounded-2xl bg-white p-7 shadow-2xl sm:p-9">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/vhod/ecoflow-logo.png" alt="EcoFlow" width={190} height={23} className="h-[18px] w-auto" />
        <h1 className="mt-6 text-2xl font-semibold leading-tight text-black">Сайтът е в подготовка</h1>
        <p className="mt-2 text-sm leading-relaxed text-[#555]">Влезте с имейла и паролата си за админа.</p>
        <VhodForm next={next} />
      </div>
    </main>
  )
}
