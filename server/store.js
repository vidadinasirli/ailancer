// Analiz tarixçəsi: DATABASE_URL varsa Supabase PostgreSQL, yoxdursa yaddaş.
import postgres from 'postgres';

const url = (process.env.DATABASE_URL || '').trim();
const useSql = /^postgres(ql)?:\/\//.test(url);
export const sql = useSql ? postgres(url, { ssl: 'require', max: 5 }) : null;
const memory = [];
let databaseReady = false;

export const provider = useSql ? 'postgres' : 'memory';
export const databaseStatus = () => ({ ready: databaseReady, provider });

export async function init() {
  if (!sql) return;
  await sql`CREATE TABLE IF NOT EXISTS analyses (
    id BIGSERIAL PRIMARY KEY,
    brief TEXT NOT NULL,
    result JSONB NOT NULL,
    input_tokens INTEGER DEFAULT 0,
    output_tokens INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
  )`;
  await sql`CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    full_name TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('freelancer', 'musteri')),
    profile JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`;
  await sql`CREATE TABLE IF NOT EXISTS categories (
    id BIGSERIAL PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`;
  await sql`INSERT INTO categories (name) VALUES
    ('Proqramlaşdırma'), ('Dizayn və kreativ'), ('Marketinq'), ('Biznes dəstəyi')
    ON CONFLICT (name) DO NOTHING`;
  await sql`CREATE TABLE IF NOT EXISTS tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    payload JSONB NOT NULL DEFAULT '{}'::jsonb,
    status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'completed', 'closed')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`;
  await sql`CREATE INDEX IF NOT EXISTS tasks_status_created_idx ON tasks (status, created_at DESC)`;
  await sql`CREATE TABLE IF NOT EXISTS task_applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    freelancer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    payload JSONB NOT NULL DEFAULT '{}'::jsonb,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'withdrawn')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (task_id, freelancer_id)
  )`;
  await sql`CREATE TABLE IF NOT EXISTS projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    payload JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`;
  await sql`CREATE INDEX IF NOT EXISTS projects_created_idx ON projects (created_at DESC)`;
  databaseReady = true;
}

export async function saveAnalysis(brief, result, usage) {
  const row = { brief, result, input_tokens: usage?.input_tokens || 0, output_tokens: usage?.output_tokens || 0 };
  if (sql) {
    const [saved] = await sql`INSERT INTO analyses ${sql(row)} RETURNING id, created_at`;
    return saved;
  }
  const saved = { id: memory.length + 1, created_at: new Date().toISOString() };
  memory.unshift({ ...saved, ...row });
  if (memory.length > 50) memory.pop();
  return saved;
}

export async function listAnalyses(limit = 20) {
  if (sql) return sql`SELECT id, brief, result, created_at FROM analyses ORDER BY id DESC LIMIT ${limit}`;
  return memory.slice(0, limit);
}
