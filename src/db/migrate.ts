import { pgPool } from './postgres';

export const runMigrations = async () => {
  try {
    await pgPool.query(`
      CREATE TABLE IF NOT EXISTS orders (
        id VARCHAR PRIMARY KEY,
        token_in VARCHAR NOT NULL,
        token_out VARCHAR NOT NULL,
        amount DECIMAL NOT NULL,
        status VARCHAR NOT NULL,
        selected_dex VARCHAR,
        tx_hash VARCHAR,
        executed_price DECIMAL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await pgPool.query(`
      CREATE TABLE IF NOT EXISTS order_failures (
        id SERIAL PRIMARY KEY,
        order_id VARCHAR NOT NULL,
        reason TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    console.log('[DB] Migrations completed');
  } catch (error) {
    console.error('[DB] Migration failed:', error);
    throw error;
  }
};