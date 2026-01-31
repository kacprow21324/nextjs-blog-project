import { neon } from '@neondatabase/serverless';

// Załaduj zmienne środowiskowe z .env
import { config } from 'dotenv';
config({ path: '.env' });

const sql = neon(process.env.DATABASE_URL);

async function initDatabase() {
  console.log('🚀 Inicjalizacja bazy danych Neon PostgreSQL...');

  try {
    // Tworzenie tabeli User
    await sql`
      CREATE TABLE IF NOT EXISTS "User" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "username" VARCHAR(255) NOT NULL UNIQUE,
        "password" VARCHAR(255) NOT NULL,
        "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `;
    console.log('✅ Tabela User utworzona');

    // Tworzenie tabeli Post
    await sql`
      CREATE TABLE IF NOT EXISTS "Post" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "title" VARCHAR(500) NOT NULL,
        "content" TEXT NOT NULL,
        "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        "authorId" UUID NOT NULL REFERENCES "User"("id") ON DELETE CASCADE
      )
    `;
    console.log('✅ Tabela Post utworzona');

    // Tworzenie tabeli Reply
    await sql`
      CREATE TABLE IF NOT EXISTS "Reply" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "text" TEXT NOT NULL,
        "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        "postId" UUID NOT NULL REFERENCES "Post"("id") ON DELETE CASCADE,
        "authorId" UUID NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
        "parentId" UUID REFERENCES "Reply"("id") ON DELETE CASCADE
      )
    `;
    console.log('✅ Tabela Reply utworzona');

    // Tworzenie tabeli Vote
    await sql`
      CREATE TABLE IF NOT EXISTS "Vote" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "type" VARCHAR(10) NOT NULL,
        "userId" UUID NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
        "postId" UUID REFERENCES "Post"("id") ON DELETE CASCADE,
        "replyId" UUID REFERENCES "Reply"("id") ON DELETE CASCADE,
        UNIQUE("userId", "postId"),
        UNIQUE("userId", "replyId")
      )
    `;
    console.log('✅ Tabela Vote utworzona');

    // Tworzenie indeksów
    await sql`CREATE INDEX IF NOT EXISTS "Post_authorId_idx" ON "Post"("authorId")`;
    await sql`CREATE INDEX IF NOT EXISTS "Post_createdAt_idx" ON "Post"("createdAt")`;
    await sql`CREATE INDEX IF NOT EXISTS "Reply_postId_idx" ON "Reply"("postId")`;
    await sql`CREATE INDEX IF NOT EXISTS "Reply_authorId_idx" ON "Reply"("authorId")`;
    await sql`CREATE INDEX IF NOT EXISTS "Reply_parentId_idx" ON "Reply"("parentId")`;
    await sql`CREATE INDEX IF NOT EXISTS "Vote_postId_idx" ON "Vote"("postId")`;
    await sql`CREATE INDEX IF NOT EXISTS "Vote_replyId_idx" ON "Vote"("replyId")`;
    console.log('✅ Indeksy utworzone');

    console.log('🎉 Baza danych zainicjalizowana pomyślnie!');
  } catch (error) {
    console.error('❌ Błąd inicjalizacji bazy:', error);
    process.exit(1);
  }
}

initDatabase();
