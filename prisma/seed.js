const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  // Create base plans
  const freePlan = await prisma.plan.findUnique({ where: { slug: 'free' } })
  if (!freePlan) {
    await prisma.plan.create({
      data: {
        name: 'Free',
        slug: 'free',
        monthlyPrice: 0,
        yearlyPrice: 0,
        maxAnalysesPerMonth: 5
      }
    })
  }

  const proPlan = await prisma.plan.findUnique({ where: { slug: 'pro' } })
  if (!proPlan) {
    await prisma.plan.create({
      data: {
        name: 'Pro',
        slug: 'pro',
        monthlyPrice: 2000, // in cents
        yearlyPrice: 18000, // yearly price (25% off)
        maxAnalysesPerMonth: 1000
      }
    })
  }

  const coachPlan = await prisma.plan.findUnique({ where: { slug: 'coach' } })
  if (!coachPlan) {
    await prisma.plan.create({
      data: {
        name: 'Coach',
        slug: 'coach',
        monthlyPrice: 4000,
        yearlyPrice: 36000,
        maxAnalysesPerMonth: 5000
      }
    })
  }

  // Create a sample user and a Free subscription for MVP testing
  let demoUser = await prisma.user.findUnique({ where: { username: 'demo' } })
  if (!demoUser) {
    demoUser = await prisma.user.create({ data: { username: 'demo' } })
  }

  let demoSub = await prisma.subscription.findFirst({ where: { userId: demoUser.id } })
  if (!demoSub) {
    // attach Free plan by default
    const free = await prisma.plan.findUnique({ where: { slug: 'free' } })
    const now = new Date()
    const end = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
    demoSub = await prisma.subscription.create({
      data: {
        userId: demoUser.id,
        planId: free?.id,
        currentPeriodStart: now,
        currentPeriodEnd: end,
        status: 'active'
      }
    })
  }

  console.log('Seeded plans and demo user/subscription.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

  }

  const proPlan = await prisma.plan.findUnique({ where: { slug: 'pro' } })
  if (!proPlan) {
    await prisma.plan.create({
      data: {
        name: 'Pro',
        slug: 'pro',
        monthlyPrice: 2000, // $20
        yearlyPrice: 18000, // 25% off yearly (12*20*100 = 240)
        maxAnalysesPerMonth: 1000,
      }
    })
  }

  const coachPlan = await prisma.plan.findUnique({ where: { slug: 'coach' } })
  if (!coachPlan) {
    await prisma.plan.create({
      data: {
        name: 'Coach',
        slug: 'coach',
        monthlyPrice: 4000, // $40
        yearlyPrice: 36000, // 25% off yearly
        maxAnalysesPerMonth: 5000,
      }
    })
  }

  console.log('Seeded plans (if missing).')
}

main()
  .catch((e) => {
    console.error(e)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
