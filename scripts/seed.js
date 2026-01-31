import { neon } from '@neondatabase/serverless';

// Załaduj zmienne środowiskowe z .env
import { config } from 'dotenv';
config({ path: '.env' });

const sql = neon(process.env.DATABASE_URL);

async function seed() {
  console.log('🌱 Seedowanie bazy danych...');

  try {
    // Tworzenie użytkownika Admin
    const adminResult = await sql`
      INSERT INTO "User" ("username", "password")
      VALUES ('Admin', 'Admin123')
      ON CONFLICT ("username") DO UPDATE SET "username" = EXCLUDED."username"
      RETURNING "id", "username"
    `;
    const admin = adminResult[0];
    console.log('✅ Użytkownik Admin:', admin.username);

    // Tworzenie użytkownika testowego
    const testUserResult = await sql`
      INSERT INTO "User" ("username", "password")
      VALUES ('Testownik', 'Testownik123')
      ON CONFLICT ("username") DO UPDATE SET "username" = EXCLUDED."username"
      RETURNING "id", "username"
    `;
    const testUser = testUserResult[0];
    console.log('✅ Użytkownik Testownik:', testUser.username);

    // Sprawdź czy post powitalny już istnieje
    const existingPost = await sql`
      SELECT "id" FROM "Post" WHERE "title" = 'Witaj w Wypasionym Blogu!' LIMIT 1
    `;

    if (existingPost.length === 0) {
      // Tworzenie posta powitalnego
      const postResult = await sql`
        INSERT INTO "Post" ("title", "content", "authorId")
        VALUES (
          'Witaj w Wypasionym Blogu!',
          'To jest pierwszy post na naszym blogu. Zapraszamy do dyskusji i dzielenia się swoimi przemyśleniami!',
          ${admin.id}
        )
        RETURNING "id"
      `;
      const welcomePost = postResult[0];

      // Dodaj przykładową odpowiedź
      await sql`
        INSERT INTO "Reply" ("text", "postId", "authorId")
        VALUES (
          'Świetny blog! Czekam na więcej postów.',
          ${welcomePost.id},
          ${testUser.id}
        )
      `;
      console.log('✅ Post powitalny z odpowiedzią utworzony');
    } else {
      console.log('ℹ️ Post powitalny już istnieje');
    }

    console.log('🎉 Seedowanie zakończone!');
  } catch (error) {
    console.error('❌ Błąd seedowania:', error);
    process.exit(1);
  }
}

seed();
