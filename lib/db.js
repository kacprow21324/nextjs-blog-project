import { neon } from '@neondatabase/serverless';

// Połączenie z Neon PostgreSQL
// Ustaw DATABASE_URL w zmiennych środowiskowych (Vercel lub .env.local)
export const sql = neon(process.env.DATABASE_URL);
