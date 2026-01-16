import React from 'react'
import dynamic from 'next/dynamic'

const PlansDashboard = dynamic(() => import('../src/components/PlansDashboard'), { ssr: false })

export default function PlansDashboardPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 to-white p-6">
      <PlansDashboard />
    </div>
  )
}
