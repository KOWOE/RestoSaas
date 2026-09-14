// @ts-ignore
import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: any
}

export const db: any =
  globalForPrisma.prisma ??
  new (PrismaClient as any)({
    log: ['query'],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db