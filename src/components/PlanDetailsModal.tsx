import React, { useState } from 'react'
import PlanSwitcher from './PlanSwitcher'

type Plan = {
  id: string
  name: string
  slug: string
  monthlyPrice: number
  yearlyPrice: number
  maxAnalysesPerMonth: number
}

const featuresMap: Record<string, string[]> = {
  free: ['basic_analysis'],
  pro: ['basic_analysis','pattern_heatmap','phase_analysis','time_trouble'],
  coach: ['basic_analysis','pattern_heatmap','phase_analysis','time_trouble','opponent_scout','custom_puzzles']
}

type Props = {
  plan: Plan
  open: boolean
  onClose: () => void
  onConfirm: (slug: string) => void
}

export default function PlanDetailsModal({ plan, open, onClose, onConfirm }: Props) {
  const [cycle, setCycle] = useState<'monthly'|'yearly'>('monthly')
  if (!open || !plan) return null

  const price = cycle === 'monthly' ? plan.monthlyPrice : plan.yearlyPrice
  const display = price === 0 ? '$0.00' : price / 100
  const priceDisplay = display ? `$${Number(display).toFixed(2)}` : '$0.00'
  const features = featuresMap[plan.slug] ?? []

  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-label={`${plan.name} plan details`} aria-modal="true">
      <div className="absolute inset-0 bg-black opacity-40" onClick={onClose} />
      <div className={`relative w-full max-w-2xl mx-auto my-20 glass`}>
        <div className="flex justify-between items-start mb-4">
          <h3 className="text-xl font-semibold">{plan.name} Plan</h3>
          <button aria-label="Close details" onClick={onClose}>Close</button>
        </div>
        <div className="flex items-center gap-4 mb-4">
          <span className="text-2xl font-bold">{priceDisplay}</span>
          <span className="text-sm text-gray-600">{cycle === 'monthly' ? '/mo' : '/yr'}</span>
          <span className="ml-auto text-sm text-gray-600">{plan.maxAnalysesPerMonth.toLocaleString()} analyses/mo</span>
        </div>
        <div className="mb-4">
          <PlanSwitcher value={cycle} onChange={setCycle} />
        </div>
        <ul className="mb-4 space-y-2 text-sm text-gray-700">
          {features.map((f) => (
            <li key={f} className="flex items-center"><span className="w-2 h-2 bg-green-500 rounded-full mr-2" aria-hidden="true" />{f}</li>
          ))}
        </ul>
        <button className="w-full py-2 px-4 rounded-md bg-indigo-600 text-white hover:bg-indigo-700" onClick={() => onConfirm(plan.slug)}>
          Subscribe to {plan.name}
        </button>
      </div>
    </div>
  )
}
