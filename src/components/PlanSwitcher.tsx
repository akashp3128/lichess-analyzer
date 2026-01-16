import React from 'react'

type Props = {
  value: 'monthly'|'yearly'
  onChange: (v: 'monthly'|'yearly') => void
}

export default function PlanSwitcher({ value, onChange }: Props) {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const k = e.key
    if (k === 'ArrowLeft' || k === 'ArrowRight') {
      e.preventDefault()
      // Toggle on any arrow key for simple MVP UX
      onChange(value === 'monthly' ? 'yearly' : 'monthly')
    }
  }
  return (
    <div
      role="group"
      aria-label="Billing cycle"
      className="inline-flex bg-white/80 backdrop-blur-sm rounded-full border border-gray-200 p-1 shadow-sm"
      tabIndex={0}
      onKeyDown={handleKeyDown}
    >
      {(['monthly','yearly'] as const).map((v) => (
        <button
          key={v}
          onClick={() => onChange(v)}
          className={`px-4 py-2 rounded-full text-sm font-medium ${value===v ? 'bg-indigo-600 text-white' : 'bg-transparent text-gray-700'}`}
        >
          {v === 'monthly' ? 'Monthly' : 'Yearly'}
        </button>
      ))}
    </div>
  )
}
