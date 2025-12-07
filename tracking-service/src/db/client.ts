import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import * as schema from './schema.js';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { mkdirSync } from 'fs';

// ESM equivalent of __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const DB_PATH = process.env.DATABASE_PATH || resolve(__dirname, '../../data/tracking.db');
mkdirSync(dirname(DB_PATH), { recursive: true });

// Create SQLite database connection
const sqlite = new Database(DB_PATH);
sqlite.pragma('journal_mode = WAL');

// Create Drizzle ORM instance with schema
export const db = drizzle(sqlite, { schema });

// Getter function for the database instance
export function getDb() {
  return db;
}

// Export the raw sqlite connection for migrations
export { sqlite };

// Export schema for convenience
export * from './schema';
