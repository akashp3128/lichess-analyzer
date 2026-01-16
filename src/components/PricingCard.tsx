import React from 'react'
import { priceToMoney } from '../lib/billing'

type Plan = {
  id: string
  name: string
  slug: string
  monthlyPrice: number
  yearlyPrice: number
  maxAnalysesPerMonth: number
}

type PricingCardProps = {
  plan: Plan
  features: string[]
  onChoose?: () => void
  popular?: boolean
  yearly?: boolean
}

// Compute potential yearly savings across plans (relative to annualized monthly price)
const getSavings = (plan: Plan) => {
  const annual = plan.monthlyPrice * 12
  if (plan.yearlyPrice && annual > 0) {
    const diff = annual - plan.yearlyPrice
    const pct = Math.round((diff / annual) * 100)
    return pct > 0 ? pct : 0
  }
  return 0
}

const PricingCard: React.FC<PricingCardProps> = ({ plan, features, onChoose, popular, yearly }) => {
  const price = yearly ? plan.yearlyPrice : plan.monthlyPrice
  const period = yearly ? '/yr' : '/mo'
  const display = price === 0 ? '$0.00' : priceToMoney(price)
  const title = plan.name
  const savings = getSavings(plan)
  return (
    <div className={`group relative rounded-xl p-6 bg-white/85 backdrop-blur-sm shadow-xl border border-gray-200 hover:shadow-2xl transition-shadow`}
      aria-label={`${title} plan`}
    >
      {popular && (
        <span className="absolute -top-2 -right-2 bg-indigo-600 text-white text-xs px-3 py-1 rounded-full">Popular</span>
      )}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">{title}</h3>
        <span className="text-sm text-gray-600">{plan.maxAnalysesPerMonth.toLocaleString()} analyses/mo</span>
      </div>
      <div className="flex items-baseline gap-2 mb-2">
        <span className="text-3xl font-extrabold">{display}</span>
        <span className="text-sm text-gray-600">{period}</span>
      </div>
      {savings > 0 && (
        <div className="text-sm text-green-700 mb-2">Save {savings}% with yearly</div>
      )}
      <p className="text-sm text-gray-600 mb-3">{plan.slug === 'free' ? 'Limited access for beginners' : 'Premium insights for serious improvement'}</p>
      <ul className="mb-4 space-y-2 text-sm text-gray-700">
        {features.map((f) => (
          <li key={f} className="flex items-center">
            <span className="w-2 h-2 bg-green-500 rounded-full mr-2" aria-hidden="true" />
            <span>{f}</span>
          </li>
        ))}
      </ul>
      <button className="w-full py-2 px-4 rounded-md bg-indigo-600 text-white hover:bg-indigo-700" onClick={onChoose ?? (()=>{})}>
        Choose {plan.name}
      </button>
    </div>
  )
}

export default PricingCard
