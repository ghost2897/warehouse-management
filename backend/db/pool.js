import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'warehouse_app',
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || 'warehouse',
  port: Number(process.env.DB_PORT) || 3306,
  waitForConnections: true,
 connectionLimit: 20,
queueLimit: 0,
decimalNumbers: true,
dateStrings: true,
ssl: process.env.DB_SSL === 'true'
  ? { rejectUnauthorized: false }
  : undefined
});

/**
 * Execute a query using the connection pool
 * @param {string} sql 
 * @param {Array} params 
 * @returns {Promise<[Array, Array]>}
 */
export async function query(sql, params = []) {
  return pool.query(sql, params);
}

/**
 * Get a connection from the pool for transactions
 * @returns {Promise<mysql.PoolConnection>}
 */
export async function getConnection() {
  return pool.getConnection();
}

/**
 * Test the database connection
 */
export async function testConnection() {
  try {
    const connection = await pool.getConnection();
    console.log('✅ Connected to MariaDB database:', process.env.DB_NAME);
    connection.release();
    return true;
  } catch (error) {
    console.error('❌ MariaDB connection error:', error.message);
    throw error;
  }
}

export default pool;

