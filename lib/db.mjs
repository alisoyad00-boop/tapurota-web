import { neon } from '@neondatabase/serverless';

const url = process.env.DATABASE_URL || process.env.POSTGRES_URL;
if (!url) {
  throw new Error('DATABASE_URL (veya POSTGRES_URL) tanımlı değil. Vercel dashboard → Storage → Postgres oluştur.');
}

export const sql = neon(url);
