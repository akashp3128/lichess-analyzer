import React from 'react'

type Props = {
  label: string
  value: number
  max: number
}

export const QuotaBar: React.FC<Props> = ({ label, value, max }) => {
  const pct = Math.min(100, Math.round((value / max) * 100))
  const ariaValue = `${value} of ${max}`
  return (
    <div className="w-full" role="meter" aria-valuenow={value} aria-valuemax={max} aria-valuemin={0} aria-label={label} aria-valuetext={ariaValue}>
      <div className="flex justify-between text-sm mb-1 text-gray-700">
        <span>{label}</span>
        <span>{value}/{max}</span>
      </div>
      <div className="h-3 bg-gray-200 rounded-full overflow-hidden" aria-label="usage-bar">
        <div className="h-full bg-indigo-600" style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}
