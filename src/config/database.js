import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

// Test de la connexion
prisma.$connect()
  .then(() => console.log('✅ Database connected successfully'))
  .catch((error) => {
    console.error('❌ Database connection failed:', error);
    process.exit(1);
  });

// Gestion de la fermeture propre
process.on('beforeExit', async () => {
  await prisma.$disconnect();
});

export default prisma;
