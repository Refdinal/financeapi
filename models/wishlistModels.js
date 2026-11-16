const pool = require("../config/db");

const getWishlist = async () => {
  const result = await pool.query(
    `SELECT id, nama, target, catatan, dibuat_pada
     FROM wishlist
     ORDER BY dibuat_pada, id`,
  );
  const items = result.rows.map((item) => ({ ...item, target: Number(item.target) }));
  const total = items.reduce((sum, item) => sum + item.target, 0);
  return { items, total: Math.round(total * 100) / 100 };
};

const createWishlist = async ({ nama, target, catatan }) => {
  const cleanNama = String(nama || "").trim();
  const amount = Math.round(Number(target) * 100) / 100;
  if (!cleanNama) throw new Error("Nama wishlist wajib diisi");
  if (!Number.isFinite(amount) || amount <= 0) throw new Error("Target harus lebih dari 0");

  const result = await pool.query(
    `INSERT INTO wishlist (nama, target, catatan)
     VALUES ($1, $2, $3)
     RETURNING id, nama, target, catatan, dibuat_pada`,
    [cleanNama, amount, String(catatan || "").trim() || null],
  );
  return { ...result.rows[0], target: Number(result.rows[0].target) };
};

const updateWishlist = async (id, { nama, target, catatan }) => {
  const cleanNama = String(nama || "").trim();
  const amount = Math.round(Number(target) * 100) / 100;
  if (!cleanNama) throw new Error("Nama wishlist wajib diisi");
  if (!Number.isFinite(amount) || amount <= 0) throw new Error("Target harus lebih dari 0");

  const result = await pool.query(
    `UPDATE wishlist
     SET nama = $2, target = $3, catatan = $4
     WHERE id = $1
     RETURNING id, nama, target, catatan, dibuat_pada`,
    [id, cleanNama, amount, String(catatan || "").trim() || null],
  );
  if (!result.rowCount) throw new Error("Item wishlist tidak ditemukan");
  return { ...result.rows[0], target: Number(result.rows[0].target) };
};

const deleteWishlist = async (id) => {
  const result = await pool.query("DELETE FROM wishlist WHERE id = $1 RETURNING id", [id]);
  if (!result.rowCount) throw new Error("Item wishlist tidak ditemukan");
  return result.rows[0].id;
};

module.exports = { getWishlist, createWishlist, updateWishlist, deleteWishlist };
