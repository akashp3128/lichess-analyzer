import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  // Create base plans
  const freePlan = await prisma.plan.create({
    data: {
      name: 'Free',
      slug: 'free',
      monthlyPrice: 0,
      yearlyPrice: 0,
      maxAnalysesPerMonth: 5,
    }
  }).catch(() => null)

  const proPlan = await prisma.plan.create({
    data: {
      name: 'Pro',
      slug: 'pro',
      monthlyPrice: 2000, // in cents
      yearlyPrice: 18000, // 25% off for yearly? but we'll apply in UI; keep as 25% off equivalent
      maxAnalysesPerMonth: 1000,
    }
  }).catch(() => null)

  const coachPlan = await prisma.plan.create({
    data: {
      name: 'Coach',
      slug: 'coach',
      monthlyPrice: 4000,
      yearlyPrice: 36000,
      maxAnalysesPerMonth: 5000,
    }
  }).catch(() => null)

  console.log({ freePlan, proPlan, coachPlan })
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
