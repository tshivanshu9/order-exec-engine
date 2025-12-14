import { Pool } from 'pg';

export const pgPool = new Pool({
  host: process.env.PG_HOST,
  port: 5432,
  user: process.env.PG_USER,
  password: process.env.PG_PASSWORD,
  database: process.env.PG_DATABASE,
});

pgPool.on('connect', () => {
  console.log('[PG] connected');
});

export const initDatabase = async (): Promise<void> => {
  try {
    await pgPool.query('SELECT 1');
    console.log('[PG] Database initialized successfully');
  } catch (error) {
    console.error('[PG] Database connection failed:', error);
    throw error;
  }
};