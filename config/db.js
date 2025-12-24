const { Pool } = require("pg");
const dns = require("dns");

dns.setDefaultResultOrder("ipv4first"); // <--- FIX VERCEL DNS BUG
const pool = new Pool({
  user: process.env.PGUSER,
  password: process.env.PGPASSWORD,
  host: process.env.PGHOST,
  port: process.env.PGPORT,
  database: process.env.PGDATABASE,

  // 🔥 WAJIB UNTUK SUPABASE + VERCEL
  ssl: { rejectUnauthorized: false },
  max: 5,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

module.exports = pool;
