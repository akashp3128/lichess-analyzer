import React, { useEffect, useState } from 'react'
import { QuotaBar } from './QuotaBar'

type Plan = {
  id: string
  name: string
  slug: string
  monthlyPrice: number
  yearlyPrice: number
  maxAnalysesPerMonth: number
}

export default function PlansDashboard() {
  const [plans, setPlans] = useState<Plan[]>([])
  const [usage, setUsage] = useState<{ plan: string; remaining: number; end?: string } | null>(null)

  const currentSlug = usage?.plan ?? 'free'

  useEffect(() => {
    fetch('/api/billing/plans')
      .then((r) => r.json())
      .then((data) => {
        const p = data.plans ?? []
        setPlans(p)
      })
      .catch((e) => {
        console.error('Plans fetch error', e)
      })

    fetch('/api/billing/usage', {
      headers: { 'x-user-id': 'demo' }
    })
      .then((r) => r.json())
      .then((data) => {
        if (data?.usage) {
          setUsage(data.usage)
        }
      })
      .catch((e) => {
        console.error('Usage fetch error', e)
      })
  }, [])

  const perPlan = plans.map((pl) => {
    let rem = pl.maxAnalysesPerMonth
    if (usage && usage.plan === pl.slug) {
      rem = usage.remaining
    } else {
      rem = Math.floor(pl.maxAnalysesPerMonth * 0.75)
    }
    return { plan: pl, remaining: rem }
  })

  return (
    <div className="p-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
      {perPlan.map(({ plan, remaining }) => (
        <div key={plan.slug} className="border rounded-lg p-4 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <strong>{plan.name}</strong>
            {usage && usage.plan === plan.slug && (
              <span className="text-xs text-gray-500 bg-blue-100 px-2 py-0.5 rounded">Current</span>
            )}
          </div>
          <div className="text-sm text-gray-600 mb-1">{plan.maxAnalysesPerMonth.toLocaleString()} analyses/mo</div>
          <div className="text-xl font-semibold mb-2">${(plan.monthlyPrice/100).toFixed(2)}/mo</div>
          <QuotaBar label={`${plan.name} usage`} value={remaining} max={plan.maxAnalysesPerMonth} />
        </div>
      ))}
    </div>
  )
}
