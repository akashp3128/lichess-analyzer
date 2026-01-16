import { PrismaClient } from '@prisma/client'
import type { NextApiRequest, NextApiResponse } from 'next'

const prisma = new PrismaClient()

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET'])
    return res.status(405).end('Method Not Allowed')
  }

  const userId = req.headers['x-user-id'] as string
  if (!userId) {
    return res.status(400).json({ error: 'Missing user' })
  }

  try {
    const sub = await prisma.subscription.findFirst({ where: { userId }, include: { plan: true } })
    res.status(200).json({ usage: { plan: sub?.plan?.slug, end: sub?.currentPeriodEnd, remaining: sub?.maxAnalysesPerMonth ?? 0 } })
  } catch (e) {
    console.error(e)
    res.status(500).json({ error: 'Failed to fetch usage' })
  } finally {
    await prisma.$disconnect()
  }
}
