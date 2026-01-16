type Plan = { id: string; name: string; slug: string; monthlyPrice: number; yearlyPrice: number; maxAnalysesPerMonth: number }

import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

export function priceToMoney(amountCents: number, currency: string = 'USD') {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amountCents/100)
}

export function canAccessFeature(planSlug: string, feature: string): boolean {
  // Simple gate map for MVP
  const gates: Record<string, string[]> = {
    free: ['basic_analysis'],
    pro: ['basic_analysis','pattern_heatmap','phase_analysis','time_trouble'],
    coach: ['basic_analysis','pattern_heatmap','phase_analysis','time_trouble','opponent_scout','custom_puzzles']
  }
  const allowed = gates[planSlug] ?? []
  return allowed.includes(feature)
}

export async function getUserPlanSlug(userId: string): Promise<string | null> {
  const sub = await prisma.subscription.findFirst({ where: { userId }, include: { plan: true } })
  return sub?.plan?.slug ?? null
}

export async function canSubmitAnalyses(userId: string, amount: number = 1): Promise<boolean> {
  // Fetch current subscription and plan
  const sub = await prisma.subscription.findFirst({ where: { userId }, include: { plan: true } })
  if (!sub) return true // if no subscription, allow as fallback (or treat as Free)

  // Reset period if ended
  const now = new Date()
  if (sub.currentPeriodEnd && sub.currentPeriodEnd < now) {
    const newStart = now
    const newEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
    await prisma.subscription.update({
      where: { id: sub.id },
      data: {
        currentPeriodStart: newStart,
        currentPeriodEnd: newEnd,
        analysesUsed: 0
      }
    })
    sub.currentPeriodStart = newStart
    sub.currentPeriodEnd = newEnd
    sub.analysesUsed = 0
  }

  const max = sub.plan?.maxAnalysesPerMonth ?? 0
  const used = sub.analysesUsed ?? 0
  if (used + amount > max) {
    return false
  }
  // Increment usage
  await prisma.subscription.update({ where: { id: sub.id }, data: { analysesUsed: used + amount } })
  return true
}
