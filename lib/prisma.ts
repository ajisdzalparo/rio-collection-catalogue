import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient(): PrismaClient {
  return new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error']
  });
}

// In development, reset client if a newly added model like materialMaster is not present on the cached instance
let prismaInstance = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== 'production') {
  if (!('materialMaster' in prismaInstance) || !('referralCode' in prismaInstance)) {
    prismaInstance = createPrismaClient();
  }
  globalForPrisma.prisma = prismaInstance;
}

export const prisma = prismaInstance;
