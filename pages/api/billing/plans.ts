import { PrismaClient } from '@prisma/client'
import type { NextApiRequest, NextApiResponse } from 'next'

const prisma = new PrismaClient()

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET'])
    return res.status(405).end('Method Not Allowed')
  }
  try {
    const plans = await prisma.plan.findMany({ orderBy: { monthlyPrice: 'asc' } })
    const sanitized = plans.map(p => ({ id: p.id, name: p.name, slug: p.slug, monthlyPrice: p.monthlyPrice, yearlyPrice: p.yearlyPrice, maxAnalysesPerMonth: p.maxAnalysesPerMonth }))
    res.status(200).json({ plans: sanitized })
  } catch (e) {
    console.error(e)
    res.status(500).json({ error: 'Failed to fetch plans' })
  } finally {
    await prisma.$disconnect()
  }
}
