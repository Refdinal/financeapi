const pool = require("../config/db");

const getAllTransaksi = async (limit) => {
  const result = await pool.query("SELECT * FROM transaksi ORDER BY tanggal DESC limit $1", [limit]);
  return result.rows;
};

const getTransaksiById = async (id) => {
  const result = await pool.query("SELECT * FROM transaksi WHERE id = $1", [id]);
  return result.rows;
};

const insertTransaksi = async (tanggal, tipe, asal, tujuan, kategori, deskripsi, jumlah) => {
  const result = await pool.query(
    "INSERT INTO transaksi (tanggal, tipe, asal, tujuan, kategori, deskripsi, jumlah) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *",
    [tanggal, tipe, asal, tujuan, kategori, deskripsi, jumlah]
  );
  return result.rows;
};
const updateTransaksi = async (id, tanggal, tipe, asal, tujuan, kategori, deskripsi, jumlah) => {
  const result = await pool.query(
    `UPDATE transaksi 
     SET tanggal = $2, tipe = $3, asal = $4, tujuan = $5, kategori = $6, deskripsi = $7, jumlah = $8
     WHERE id = $1
     RETURNING *`,
    [id, tanggal, tipe, asal, tujuan, kategori, deskripsi, jumlah]
  );
  return result.rows;
};

const deleteTransaksiById = async (id) => {
  const result = await pool.query("DELETE FROM transaksi WHERE id = $1", [id]);
  return result.rows;
};

const getTotalSaldo = async () => {
  const result = await pool.query(`
    SELECT akun, SUM(saldo) AS total_saldo
    FROM (
      SELECT tujuan AS akun, jumlah AS saldo
      FROM transaksi
      WHERE tipe = 'pemasukan'

      UNION ALL

      SELECT asal AS akun, -jumlah AS saldo
      FROM transaksi
      WHERE tipe = 'pengeluaran'
    ) AS pergerakan
    GROUP BY akun
    ORDER BY akun;
    `);
  return result.rows;
};
const getLiquid = async () => {
  const result = await pool.query(`
WITH pergerakan AS (
  SELECT tujuan AS akun, jumlah AS saldo
  FROM transaksi
  WHERE tipe = 'pemasukan'

  UNION ALL

  SELECT asal AS akun, -jumlah AS saldo
  FROM transaksi
  WHERE tipe = 'pengeluaran'
),
total_saldo_per_akun AS (
  SELECT akun, SUM(saldo) AS total_saldo
  FROM pergerakan
  GROUP BY akun
)
SELECT
  SUM(total_saldo) AS total_saldo
FROM total_saldo_per_akun
WHERE akun != 'BCA';


    `);
  return result.rows;
};

const getInvestasi = async () => {
  const result = await pool.query(`
    SELECT
    SUM(CASE 
          WHEN kategori = 'investasi' THEN jumlah
          WHEN kategori = 'pencairan' THEN -jumlah
          ELSE 0
        END) AS total_investasi_berjalan
    FROM transaksi;

    `);
  return result.rows;
};

const getAkunInvestasi = async () => {
  const result = await pool.query(`
    SELECT
        akun,
        SUM(
            CASE
                WHEN kategori = 'investasi' AND tujuan = akun THEN jumlah
                WHEN kategori = 'pencairan' AND asal = akun THEN -jumlah
                ELSE 0
            END
        ) AS total_investasi
    FROM (
        SELECT tujuan AS akun FROM transaksi WHERE kategori = 'investasi'
        UNION
        SELECT asal   AS akun FROM transaksi WHERE kategori = 'pencairan'
    ) akun_list
    JOIN transaksi ON (
          (transaksi.kategori = 'investasi' AND transaksi.tujuan = akun_list.akun)
        OR (transaksi.kategori = 'pencairan' AND transaksi.asal   = akun_list.akun)
    )
    GROUP BY akun
    ORDER BY akun;

    `);
  return result.rows;
};

const getBelanjaBulanan = async () => {
  const result = await pool.query(`
 WITH t_belanja AS(
 SELECT
      DATE_TRUNC('month', tanggal) AS bulan,
      SUM(jumlah) FILTER (WHERE kategori = 'sekunder') AS sekunder,
      SUM(jumlah) FILTER (WHERE kategori = 'tersier') AS tersier,
      SUM(jumlah) FILTER (WHERE kategori = 'pangan') AS pangan,
      SUM(jumlah) FILTER (WHERE kategori = 'sandang') AS sandang,
      SUM(jumlah) FILTER (WHERE kategori = 'papan') AS papan,
	  SUM(jumlah) AS total_belanja
    FROM transaksi
    WHERE
      tipe = 'pengeluaran'
      AND tujuan = 'belanja'
    GROUP BY DATE_TRUNC('month', tanggal)
    ORDER BY DATE_TRUNC('month', tanggal) DESC),
	t_amal AS(
	SELECT
      DATE_TRUNC('month', tanggal) AS bulan,
	  SUM(jumlah) AS Amal
    FROM transaksi
    WHERE
      tipe = 'pengeluaran'
      AND tujuan = 'amal'
    GROUP BY DATE_TRUNC('month', tanggal)
    ORDER BY DATE_TRUNC('month', tanggal))
SELECT t_belanja.*,t_amal.amal FROM t_belanja
LEFT JOIN t_amal
ON t_belanja.bulan = t_amal.bulan

    `);
  return result.rows;
};

module.exports = {
  getAllTransaksi,
  getTransaksiById,
  insertTransaksi,
  updateTransaksi,
  deleteTransaksiById,
  getTotalSaldo,
  getLiquid,
  getInvestasi,
  getAkunInvestasi,
  getBelanjaBulanan,
};
