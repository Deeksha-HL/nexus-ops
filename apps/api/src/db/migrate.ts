import { readFile } from 'node:fs/promises'; import { fileURLToPath } from 'node:url'; import { dirname, join } from 'node:path'; import { pool } from './index.js';
const here=dirname(fileURLToPath(import.meta.url));
await pool.query(await readFile(join(here,'schema.sql'),'utf8')); console.log('Database migrated.'); await pool.end();
