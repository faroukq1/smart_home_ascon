import { PrismaClient } from '@prisma/client';

let prisma: PrismaClient | null = null;

export const getPrismaClient = (): PrismaClient => {
  if (!prisma) {
    prisma = new PrismaClient();
  }
  return prisma;
};

export const closePrismaClient = async () => {
  if (prisma) {
    await prisma.$disconnect();
    prisma = null;
  }
};
