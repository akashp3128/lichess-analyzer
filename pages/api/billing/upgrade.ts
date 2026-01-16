import { PrismaClient } from '@prisma/client'
import type { NextApiRequest, NextApiResponse } from 'next'

const prisma = new PrismaClient()

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST'])
    return res.status(405).end('Method Not Allowed')
  }

  const userId = req.headers['x-user-id'] as string
  const planSlug = req.body?.plan as string
  if (!userId || !planSlug) {
    return res.status(400).json({ error: 'Missing user or plan' })
  }

  try {
    // Ensure user exists
    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (!user) return res.status(404).json({ error: 'User not found' })

    const plan = await prisma.plan.findUnique({ where: { slug: planSlug } })
    if (!plan) return res.status(404).json({ error: 'Plan not found' })

    const now = new Date()
    const end = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)

    // Check if a subscription exists; if so, upgrade; otherwise create new
    let sub = await prisma.subscription.findFirst({ where: { userId: user.id } })
    if (sub) {
      sub = await prisma.subscription.update({
        where: { id: sub.id },
        data: {
          planId: plan.id,
          currentPeriodStart: now,
          currentPeriodEnd: end,
          analysesUsed: 0
        }
      })
    } else {
      sub = await prisma.subscription.create({
        data: {
          userId: user.id,
          planId: plan.id,
          currentPeriodStart: now,
          currentPeriodEnd: end,
          status: 'active'
        }
      })
    }

    res.status(200).json({ subscription: sub, plan: plan })
  } catch (e) {
    console.error(e)
    res.status(500).json({ error: 'Upgrade failed' })
  } finally {
    await prisma.$disconnect()
  }
}
