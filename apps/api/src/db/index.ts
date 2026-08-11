import pg from 'pg';
import 'dotenv/config';
export const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
export const query = <T = any>(text: string, params?: unknown[]) => pool.query(text, params) as Promise<{ rows: T[] }>;
