const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Tworzenie domyślnych użytkowników
  const admin = await prisma.user.upsert({
    where: { username: 'Admin' },
    update: {},
    create: {
      username: 'Admin',
      password: 'Admin123',
    },
  });

  const testUser = await prisma.user.upsert({
    where: { username: 'Testownik' },
    update: {},
    create: {
      username: 'Testownik',
      password: 'Testownik123',
    },
  });

  console.log('✅ Created users:', { admin: admin.username, testUser: testUser.username });

  // Tworzenie przykładowego posta
  const existingPost = await prisma.post.findFirst({
    where: { title: 'Witaj w Wypasionym Blogu!' },
  });

  if (!existingPost) {
    const welcomePost = await prisma.post.create({
      data: {
        title: 'Witaj w Wypasionym Blogu!',
        content: 'To jest pierwszy post na naszym blogu. Zapraszamy do dyskusji i dzielenia się swoimi przemyśleniami!',
        authorId: admin.id,
      },
    });

    // Dodaj przykładową odpowiedź
    await prisma.reply.create({
      data: {
        text: 'Świetny blog! Czekam na więcej postów.',
        postId: welcomePost.id,
        authorId: testUser.id,
      },
    });

    console.log('✅ Created welcome post with reply');
  }

  console.log('🎉 Seeding completed!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
