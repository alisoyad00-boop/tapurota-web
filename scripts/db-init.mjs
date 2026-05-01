/* Tabloları oluşturur. Her zaman güvenli (IF NOT EXISTS). */
import { sql } from '../lib/db.mjs';

await sql`
  CREATE TABLE IF NOT EXISTS properties (
    id            SERIAL PRIMARY KEY,
    slug          TEXT UNIQUE NOT NULL,
    category      TEXT NOT NULL,
    tag           TEXT,
    location      TEXT NOT NULL,
    title         TEXT NOT NULL,
    description   TEXT,
    price         BIGINT,
    area          TEXT,
    meta          JSONB DEFAULT '{}'::jsonb,
    images        TEXT[] DEFAULT ARRAY[]::TEXT[],
    cover         TEXT,
    featured      BOOLEAN DEFAULT FALSE,
    published     BOOLEAN DEFAULT TRUE,
    created_at    TIMESTAMPTZ DEFAULT NOW(),
    updated_at    TIMESTAMPTZ DEFAULT NOW()
  )
`;

await sql`
  CREATE TABLE IF NOT EXISTS admin_users (
    id             SERIAL PRIMARY KEY,
    username       TEXT UNIQUE NOT NULL,
    password_hash  TEXT NOT NULL,
    created_at     TIMESTAMPTZ DEFAULT NOW()
  )
`;

await sql`CREATE INDEX IF NOT EXISTS idx_properties_published ON properties (published)`;
await sql`CREATE INDEX IF NOT EXISTS idx_properties_featured ON properties (featured) WHERE featured = TRUE`;
await sql`CREATE INDEX IF NOT EXISTS idx_properties_category ON properties (category)`;

console.log('✓ Tablolar hazır.');
