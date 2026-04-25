import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function categoryInjection() {
  const categories = [
    { name: 'Programming' },
    { name: 'Design' },
    { name: 'Sports' },
  ];

  console.log('Categories seeding...');
  /**
   * * this part is just during development
   * ? Upsert categories to avoid duplicates if the seed script is run multiple times
   */
  for (const cat of categories) {
    await prisma.category.upsert({
      where: { name: cat.name },
      update: {},
      create: cat,
    });
  }

  console.log('Categories seeded successfully!');
}

categoryInjection()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
