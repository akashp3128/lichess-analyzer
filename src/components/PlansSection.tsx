import React from 'react'
import PricingCard from './PricingCard'
import PlanSwitcher from './PlanSwitcher'
import PlanDetailsModal from './PlanDetailsModal'

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

const plans: Plan[] = [
  { id: 'p1', name: 'Free', slug: 'free', monthlyPrice: 0, yearlyPrice: 0, maxAnalysesPerMonth: 5 },
  { id: 'p2', name: 'Pro', slug: 'pro', monthlyPrice: 2000, yearlyPrice: 18000, maxAnalysesPerMonth: 1000 },
  { id: 'p3', name: 'Coach', slug: 'coach', monthlyPrice: 4000, yearlyPrice: 36000, maxAnalysesPerMonth: 5000 },
]

export default function PlansSection() {
  const [cycle, setCycle] = React.useState<'monthly'|'yearly'>('monthly')
  const [open, setOpen] = React.useState(false)
  const [selected, setSelected] = React.useState<Plan | null>(null)

  return (
    <section className="max-w-7xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-semibold">Plans</h2>
        <p className="text-sm text-gray-600">Choose a plan and unlock features.</p>
      </div>
      <div className="flex justify-center mb-6">
        <PlanSwitcher value={cycle} onChange={setCycle} />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {plans.map((p) => (
          <div key={p.slug}>
            <PricingCard plan={p} yearly={cycle==='yearly'} features={featuresMap[p.slug]} onChoose={() => {
              setSelected(p)
              setOpen(true)
            }} />
          </div>
        ))}
      </div>
      <PlanDetailsModal
        plan={selected ?? plans[0]}
        open={open}
        onClose={() => setOpen(false)}
        onConfirm={(slug) => {
          // Forward to subscribe endpoint (demo)
          fetch('/api/billing/subscribe', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'x-user-id': 'demo' },
            body: JSON.stringify({ plan: slug })
          }).then(r => r.json()).then(console.log).catch(console.error)
          setOpen(false)
        }}
      />
    </section>
  )
}
