import React, { useState } from 'react'
import PricingCard from '../src/components/PricingCard'
import PlanSwitcher from '../src/components/PlanSwitcher'

type Plan = {
  id: string
  name: string
  slug: string
  monthlyPrice: number
  yearlyPrice: number
  maxAnalysesPerMonth: number
}

const PLANS: Plan[] = [
  { id: 'p1', name: 'Free', slug: 'free', monthlyPrice: 0, yearlyPrice: 0, maxAnalysesPerMonth: 5 },
  { id: 'p2', name: 'Pro', slug: 'pro', monthlyPrice: 2000, yearlyPrice: 18000, maxAnalysesPerMonth: 1000 },
  { id: 'p3', name: 'Coach', slug: 'coach', monthlyPrice: 4000, yearlyPrice: 36000, maxAnalysesPerMonth: 5000 },
]

const FEATURES: Record<string, string[]> = {
  free: ['basic_analysis'],
  pro: ['basic_analysis','pattern_heatmap','phase_analysis','time_trouble'],
  coach: ['basic_analysis','pattern_heatmap','phase_analysis','time_trouble','opponent_scout','custom_puzzles']
}

export default function PlansPage() {
  const [cycle, setCycle] = useState<'monthly'|'yearly'>('monthly')

  const priceDisplay = (plan: Plan) => {
    const price = cycle === 'yearly' ? plan.yearlyPrice : plan.monthlyPrice
    if (price === 0) return '$0.00'
    return '$' + (price/100).toFixed(2)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-white to-gray-50 p-6">
      <section className="max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold">Choose your plan</h1>
          <p className="text-sm text-gray-600 mt-2">Unlock advanced chess insights with a subscription.</p>
        </div>
        <div className="flex justify-center mb-6">
          <PlanSwitcher value={cycle} onChange={setCycle} />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {PLANS.map(p => (
            <div key={p.slug} className="border rounded-lg p-4 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <strong>{p.name}</strong>
                <span className="text-sm text-gray-600">{p.maxAnalysesPerMonth.toLocaleString()} analyses/mo</span>
              </div>
              <div className="text-2xl font-bold">{priceDisplay(p)}</div>
              <div className="text-sm text-gray-600 mb-2">{cycle === 'yearly' ? '/yr' : '/mo'}</div>
              <p className="text-sm text-gray-600 mb-3">{p.slug === 'free' ? 'Limited access for beginners' : 'Premium insights for serious improvement'}</p>
              <ul className="mb-4 space-y-2 text-sm text-gray-700">
                {(FEATURES[p.slug] ?? []).map((f) => (
                  <li key={f} className="flex items-center"><span className="w-2 h-2 bg-green-500 rounded-full mr-2" aria-hidden="true" /><span>{f}</span></li>
                ))}
              </ul>
              <button className="w-full py-2 px-4 rounded-md bg-indigo-600 text-white hover:bg-indigo-700" onClick={() => {
                fetch('/api/billing/subscribe', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json', 'x-user-id': 'demo' },
                  body: JSON.stringify({ plan: p.slug })
                }).then(r => r.json()).then(console.log).catch(console.error)
              }}>Choose {p.name}</button>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
