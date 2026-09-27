const pool = require("../config/db");
const crypto = require("crypto");
const {
  AKUN,
  ALOKASI,
  TIPE,
  KATEGORI,
  TUJUAN_BELANJA,
  TUJUAN_AMAL,
  SUMBER_AMAL,
  JENIS_PENDAPATAN,
  TUJUAN_PENDAPATAN_UTAMA,
} = require("../config/keuangan");

const LIQUID = AKUN.liquid;
const DARURAT = AKUN.darurat;
const INVESTASI = AKUN.investasi;
const LIQUID_DARURAT = [...LIQUID, ...DARURAT];
// Pengeluaran boleh dari akun liquid atau bca (dana darurat), tanpa mengubah pos alokasi.
const ASAL_PENGELUARAN = [...LIQUID, DARURAT[0]];
const POS_KEYS = ALOKASI.map((a) => a.key);

// --- Helper: bagi jumlah ke pos alokasi, presisi 2 desimal, total pas (tanpa sisa) ---
// Dihitung dalam satuan sen (integer) agar tidak ada galat pembulatan float.
const hitungAlokasi = (jumlah) => {
  const nCents = Math.round(Number(jumlah) * 100);
  const rows = ALOKASI.map((a) => ({
    alokasi: a.key,
    cents: Math.floor((nCents * a.persen) / 100),
  }));
  const total = rows.reduce((s, r) => s + r.cents, 0);
  const sisa = nCents - total;
  if (sisa !== 0) {
    let maxIdx = 0;
    rows.forEach((r, i) => {
      if (r.cents > rows[maxIdx].cents) maxIdx = i;
    });
    rows[maxIdx].cents += sisa;
  }
  return rows.map((r) => ({ alokasi: r.alokasi, jumlah: r.cents / 100 }));
};

// Bulatkan nominal ke 2 desimal (sen).
const round2 = (nilai) => Math.round(Number(nilai) * 100) / 100;

// --- Validasi payload per tipe ---
const validateTransaksi = (p) => {
  if (!p || !TIPE.some((t) => t.key === p.tipe)) throw new Error("Tipe transaksi tidak valid");
  if (!(Number(p.jumlah) > 0)) throw new Error("Jumlah harus lebih dari 0");
  if (!p.tanggal) throw new Error("Tanggal wajib diisi");

  switch (p.tipe) {
    case "pendapatan":
      if (!JENIS_PENDAPATAN.includes(p.asal)) throw new Error("Jenis pendapatan tidak valid");
      if (p.asal === "utama" && p.tujuan !== TUJUAN_PENDAPATAN_UTAMA)
        throw new Error("Pendapatan utama hanya masuk ke nagari");
      if (p.asal === "sampingan" && !LIQUID_DARURAT.includes(p.tujuan))
        throw new Error("Tujuan pendapatan sampingan tidak valid");
      break;
    case "pengeluaran":
      if (!KATEGORI.map((k) => k.key).includes(p.kategori)) throw new Error("Kategori tidak valid");
      if (!ASAL_PENGELUARAN.includes(p.asal)) throw new Error("Asal pengeluaran harus akun liquid atau bca");
      if (p.kategori === "belanja" && !TUJUAN_BELANJA.includes(p.tujuan))
        throw new Error("Tujuan belanja tidak valid");
      if (p.kategori === "amal") {
        if (!TUJUAN_AMAL.includes(p.tujuan)) throw new Error("Tujuan amal tidak valid");
        if (p.asal !== DARURAT[0] && !SUMBER_AMAL.includes(p.alokasi))
          throw new Error("Sumber pos amal tidak valid");
      }
      break;
    case "pemindahan":
      if (!LIQUID_DARURAT.includes(p.asal) || !LIQUID_DARURAT.includes(p.tujuan))
        throw new Error("Akun pemindahan tidak valid");
      if (p.asal === p.tujuan) throw new Error("Asal dan tujuan tidak boleh sama");
      break;
    case "masuk_investasi":
      if (!LIQUID_DARURAT.includes(p.asal)) throw new Error("Asal masuk investasi tidak valid");
      if (!INVESTASI.includes(p.tujuan)) throw new Error("Tujuan masuk investasi tidak valid");
      break;
    case "tarik_investasi":
      if (!INVESTASI.includes(p.asal)) throw new Error("Asal tarik investasi tidak valid");
      if (p.tujuan !== DARURAT[0]) throw new Error("Tujuan tarik investasi harus bca");
      break;
    default:
      throw new Error("Tipe transaksi tidak valid");
  }
};

const rupiah = (n) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 2,
  }).format(Number(n) || 0);

const labelPos = (key) => ALOKASI.find((a) => a.key === key)?.label || key;

// Saldo pos alokasi berdasarkan koneksi (dipakai di dalam transaksi DB).
const saldoPos = async (client, pos) => {
  const r = await client.query(
    `SELECT COALESCE(SUM(CASE WHEN jenis = 'masuk' THEN jumlah ELSE -jumlah END), 0) AS saldo
     FROM alokasi WHERE alokasi = $1`,
    [pos],
  );
  return Number(r.rows[0].saldo);
};

// Tolak bila pengurangan pos membuat saldonya negatif.
const cekSaldoPos = async (client, pos, jumlah) => {
  const saldo = await saldoPos(client, pos);
  if (saldo - jumlah < 0) {
    throw new Error(
      `Saldo pos "${labelPos(pos)}" tidak cukup (tersedia ${rupiah(saldo)}, dibutuhkan ${rupiah(
        jumlah,
      )}). Hilangkan centang "Ubah tabel alokasi" untuk menyimpan tanpa mengubah alokasi.`,
    );
  }
};

// --- CREATE (menangani semua tipe + generasi alokasi) ---
const createTransaksi = async (p) => {
  validateTransaksi(p);
  const jumlah = round2(p.jumlah);
  const tanggal = p.tanggal;
  const deskripsi = p.deskripsi || null;
  // Centang "ubah alokasi": default true. Jika false, transaksi tidak menyentuh tabel alokasi.
  const ubahAlokasi = p.ubah_alokasi !== false;

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const insTrx = (f) =>
      client.query(
        `INSERT INTO transaksi (grup_id, tanggal, tipe, arah, kategori, asal, tujuan, deskripsi, jumlah, ubah_alokasi)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
        [
          f.grup_id || null,
          tanggal,
          p.tipe,
          f.arah,
          f.kategori || null,
          f.asal,
          f.tujuan,
          deskripsi,
          jumlah,
          ubahAlokasi,
        ],
      );

    const insAlokasi = (trxId, jenis, pos, jml) =>
      client.query(
        `INSERT INTO alokasi (transaksi_id, tanggal, jenis, alokasi, jumlah)
         VALUES ($1, $2, $3, $4, $5)`,
        [trxId, tanggal, jenis, pos, jml],
      );

    const created = [];

    if (p.tipe === "pendapatan") {
      const t = await insTrx({ arah: "masuk", asal: p.asal, tujuan: p.tujuan });
      created.push(t.rows[0]);
      if (ubahAlokasi && p.asal === "utama") {
        for (const a of hitungAlokasi(jumlah)) {
          await insAlokasi(t.rows[0].id, "masuk", a.alokasi, a.jumlah);
        }
      }
    } else if (p.tipe === "pengeluaran") {
      const t = await insTrx({ arah: "keluar", kategori: p.kategori, asal: p.asal, tujuan: p.tujuan });
      created.push(t.rows[0]);
      // Pengeluaran dari bca tidak mengubah pos alokasi.
      if (ubahAlokasi && p.asal !== DARURAT[0]) {
        const pos = p.kategori === "belanja" ? "pribadi" : p.alokasi;
        await cekSaldoPos(client, pos, jumlah);
        await insAlokasi(t.rows[0].id, "keluar", pos, jumlah);
      }
    } else if (p.tipe === "pemindahan") {
      const grup = crypto.randomUUID();
      const keluar = await insTrx({ grup_id: grup, arah: "keluar", asal: p.asal, tujuan: p.tujuan });
      const masuk = await insTrx({ grup_id: grup, arah: "masuk", asal: p.asal, tujuan: p.tujuan });
      created.push(keluar.rows[0], masuk.rows[0]);
      // Realisasi dana darurat: pos dana_darurat berkurang saat masuk ke bca.
      if (ubahAlokasi && p.tujuan === DARURAT[0]) {
        await cekSaldoPos(client, "dana_darurat", jumlah);
        await insAlokasi(keluar.rows[0].id, "keluar", "dana_darurat", jumlah);
      }
    } else if (p.tipe === "masuk_investasi") {
      const grup = crypto.randomUUID();
      const keluar = await insTrx({ grup_id: grup, arah: "keluar", asal: p.asal, tujuan: p.tujuan });
      const masuk = await insTrx({ grup_id: grup, arah: "masuk", asal: p.asal, tujuan: p.tujuan });
      created.push(keluar.rows[0], masuk.rows[0]);
      if (ubahAlokasi) {
        await cekSaldoPos(client, "investasi", jumlah);
        await insAlokasi(keluar.rows[0].id, "keluar", "investasi", jumlah);
      }
    } else if (p.tipe === "tarik_investasi") {
      const grup = crypto.randomUUID();
      const keluar = await insTrx({ grup_id: grup, arah: "keluar", asal: p.asal, tujuan: p.tujuan });
      const masuk = await insTrx({ grup_id: grup, arah: "masuk", asal: p.asal, tujuan: p.tujuan });
      created.push(keluar.rows[0], masuk.rows[0]);
    }

    await client.query("COMMIT");
    return created;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

const getAllTransaksi = async (limit, filters = {}) => {
  const { q, tipe, asal, tujuan, dari, sampai } = filters;
  const kondisi = [];
  const params = [];

  if (tipe) {
    params.push(tipe);
    kondisi.push(`tipe = $${params.length}`);
  }
  if (asal) {
    params.push(asal);
    kondisi.push(`asal = $${params.length}`);
  }
  if (tujuan) {
    params.push(tujuan);
    kondisi.push(`tujuan = $${params.length}`);
  }
  if (dari) {
    params.push(dari);
    kondisi.push(`tanggal >= $${params.length}::date`);
  }
  if (sampai) {
    params.push(sampai);
    kondisi.push(`tanggal < ($${params.length}::date + INTERVAL '1 day')`);
  }
  if (q) {
    params.push(`%${q}%`);
    kondisi.push(
      `(deskripsi ILIKE $${params.length} OR kategori ILIKE $${params.length} OR asal ILIKE $${params.length} OR tujuan ILIKE $${params.length})`,
    );
  }

  params.push(limit);
  const where = kondisi.length ? `WHERE ${kondisi.join(" AND ")}` : "";
  const result = await pool.query(
    `SELECT * FROM transaksi ${where} ORDER BY tanggal DESC, id DESC LIMIT $${params.length}`,
    params,
  );
  return result.rows;
};

const getFilterOpsi = async () => {
  const [asal, tujuan] = await Promise.all([
    pool.query(
      `SELECT DISTINCT asal FROM transaksi WHERE asal IS NOT NULL AND asal <> '' ORDER BY asal`,
    ),
    pool.query(
      `SELECT DISTINCT tujuan FROM transaksi WHERE tujuan IS NOT NULL AND tujuan <> '' ORDER BY tujuan`,
    ),
  ]);
  return {
    asal: asal.rows.map((r) => r.asal),
    tujuan: tujuan.rows.map((r) => r.tujuan),
  };
};

const getTransaksiById = async (id) => {
  const result = await pool.query("SELECT * FROM transaksi WHERE id = $1", [id]);
  return result.rows;
};

const deleteTransaksi = async (id) => {
  const rows = await getTransaksiById(id);
  if (rows.length === 0) return { deleted: 0, grup_id: null };
  const grupId = rows[0].grup_id;
  let result;
  if (grupId) {
    result = await pool.query("DELETE FROM transaksi WHERE grup_id = $1", [grupId]);
  } else {
    result = await pool.query("DELETE FROM transaksi WHERE id = $1", [id]);
  }
  return { deleted: result.rowCount, grup_id: grupId };
};

// Edit: hapus transaksi (beserta pasangan grup + alokasi cascade), lalu buat ulang.
const updateTransaksi = async (id, payload) => {
  const rows = await getTransaksiById(id);
  if (rows.length === 0) throw new Error("Transaksi tidak ditemukan");
  await deleteTransaksi(id);
  const created = await createTransaksi(payload);
  return created;
};

// Saldo per akun: arah masuk menambah tujuan, arah keluar mengurangi asal.
const getSaldo = async () => {
  const result = await pool.query(`
    SELECT akun, SUM(saldo) AS saldo FROM (
      SELECT tujuan AS akun, jumlah AS saldo FROM transaksi WHERE arah = 'masuk'
      UNION ALL
      SELECT asal AS akun, -jumlah AS saldo FROM transaksi WHERE arah = 'keluar'
    ) t
    WHERE akun IS NOT NULL
    GROUP BY akun
    ORDER BY akun;
  `);
  return result.rows;
};

// Saldo tiap pos alokasi (semua pos selalu muncul).
const getAlokasi = async () => {
  const result = await pool.query(`
    SELECT alokasi,
      COALESCE(SUM(CASE WHEN jenis = 'masuk' AND transaksi_id IS NOT NULL THEN jumlah ELSE 0 END), 0) AS total_masuk,
      COALESCE(SUM(CASE WHEN jenis = 'keluar' AND transaksi_id IS NOT NULL THEN jumlah ELSE 0 END), 0) AS total_keluar,
      COALESCE(SUM(CASE WHEN jenis = 'masuk' THEN jumlah ELSE -jumlah END), 0) AS saldo
    FROM alokasi
    GROUP BY alokasi;
  `);
  const map = {};
  result.rows.forEach((r) => (map[r.alokasi] = r));

  const alokasi = ALOKASI.map((a) => {
    const r = map[a.key];
    return {
      key: a.key,
      label: a.label,
      persen: a.persen,
      total_masuk: r ? round2(r.total_masuk) : 0,
      total_keluar: r ? round2(r.total_keluar) : 0,
      saldo: r ? round2(r.saldo) : 0,
    };
  });
  return alokasi;
};

const getAlokasiRiwayat = async (limit) => {
  const result = await pool.query(
    `SELECT * FROM alokasi ORDER BY tanggal DESC, id DESC LIMIT $1`,
    [limit],
  );
  return result.rows;
};

// Pindah alokasi antar pos tanpa menyentuh akun (transaksi_id = null).
const pindahAlokasi = async (p) => {
  const jumlah = round2(p.jumlah);
  if (!POS_KEYS.includes(p.dari) || !POS_KEYS.includes(p.ke)) throw new Error("Pos alokasi tidak valid");
  if (p.dari === p.ke) throw new Error("Pos asal dan tujuan tidak boleh sama");
  if (!(jumlah > 0)) throw new Error("Jumlah harus lebih dari 0");
  if (!p.tanggal) throw new Error("Tanggal wajib diisi");

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query(
      `INSERT INTO alokasi (transaksi_id, tanggal, jenis, alokasi, jumlah) VALUES (NULL, $1, 'keluar', $2, $3)`,
      [p.tanggal, p.dari, jumlah],
    );
    await client.query(
      `INSERT INTO alokasi (transaksi_id, tanggal, jenis, alokasi, jumlah) VALUES (NULL, $1, 'masuk', $2, $3)`,
      [p.tanggal, p.ke, jumlah],
    );
    await client.query("COMMIT");
    return { dari: p.dari, ke: p.ke, jumlah };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

// Hapus satu baris riwayat alokasi berdasarkan id.
const deleteAlokasi = async (id) => {
  const result = await pool.query("DELETE FROM alokasi WHERE id = $1 RETURNING id", [id]);
  return result.rowCount;
};

// Nilai investasi = saldo akun investasi.
const getInvestasi = async (saldoRows) => {
  const saldo = saldoRows || (await getSaldo());
  const rincian = INVESTASI.map((akun) => {
    const row = saldo.find((s) => s.akun === akun);
    return { akun, saldo: row ? Number(row.saldo) : 0 };
  });
  const total = rincian.reduce((s, r) => s + r.saldo, 0);
  return { total, rincian };
};

// Pengeluaran 12 bulan terakhir: pokok (sandang/pangan/papan) dan total (+sekunder/tersier/amal).
const getBelanjaBulanan = async () => {
  // Patokan bulan = bulan pengeluaran terakhir di database (bukan bulan sekarang),
  // agar jendela 12 bulan selalu memuat data pengeluaran.
  const anchorRes = await pool.query(
    "SELECT MAX(tanggal) AS max_tanggal FROM transaksi WHERE tipe = 'pengeluaran' AND arah = 'keluar'",
  );
  const maxTanggal = anchorRes.rows[0].max_tanggal;

  const result = await pool.query(
    `SELECT
      DATE_TRUNC('month', tanggal) AS bulan,
      COALESCE(SUM(jumlah) FILTER (WHERE kategori = 'belanja' AND tujuan = 'sandang'), 0) AS sandang,
      COALESCE(SUM(jumlah) FILTER (WHERE kategori = 'belanja' AND tujuan = 'pangan'), 0) AS pangan,
      COALESCE(SUM(jumlah) FILTER (WHERE kategori = 'belanja' AND tujuan = 'papan'), 0) AS papan,
      COALESCE(SUM(jumlah) FILTER (WHERE kategori = 'belanja' AND tujuan = 'sekunder'), 0) AS sekunder,
      COALESCE(SUM(jumlah) FILTER (WHERE kategori = 'belanja' AND tujuan = 'tersier'), 0) AS tersier,
      COALESCE(SUM(jumlah) FILTER (WHERE kategori = 'amal'), 0) AS amal
    FROM transaksi
    WHERE tipe = 'pengeluaran' AND arah = 'keluar'
      AND tanggal >= DATE_TRUNC('month', $1::timestamp) - INTERVAL '11 months'
    GROUP BY DATE_TRUNC('month', tanggal)
    ORDER BY 1;`,
    [maxTanggal],
  );

  const map = {};
  result.rows.forEach((r) => {
    const d = new Date(r.bulan);
    map[`${d.getFullYear()}-${d.getMonth()}`] = r;
  });

  // Susun 12 bulan terakhir (berakhir di bulan transaksi terakhir), bulan tanpa data = 0.
  const now = maxTanggal ? new Date(maxTanggal) : new Date();
  const out = [];
  for (let i = 11; i >= 0; i -= 1) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const r = map[`${d.getFullYear()}-${d.getMonth()}`];
    const n = (k) => (r ? Number(r[k]) : 0);
    const sandang = n("sandang");
    const pangan = n("pangan");
    const papan = n("papan");
    const sekunder = n("sekunder");
    const tersier = n("tersier");
    const amal = n("amal");
    const pokok = sandang + pangan + papan;
    const sekunder_tersier = sekunder + tersier;
    out.push({
      bulan: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`,
      sandang,
      pangan,
      papan,
      pokok,
      sekunder,
      tersier,
      sekunder_tersier,
      amal,
      total: pokok + sekunder_tersier + amal,
    });
  }
  return out;
};

// Transaksi pengeluaran yang masuk ke grafik (belanja + amal) pada 12 bulan terakhir.
const getBelanjaTransaksi = async (limit = 200) => {
  const anchorRes = await pool.query(
    "SELECT MAX(tanggal) AS max_tanggal FROM transaksi WHERE tipe = 'pengeluaran' AND arah = 'keluar'",
  );
  const maxTanggal = anchorRes.rows[0].max_tanggal;
  const result = await pool.query(
    `SELECT id, tanggal, kategori, asal, tujuan, deskripsi, jumlah
     FROM transaksi
     WHERE tipe = 'pengeluaran' AND arah = 'keluar' AND (kategori = 'belanja' OR kategori = 'amal')
       AND tanggal >= DATE_TRUNC('month', $1::timestamp) - INTERVAL '11 months'
     ORDER BY tanggal DESC
     LIMIT $2`,
    [maxTanggal, limit],
  );
  return result.rows;
};

const getDashboard = async () => {
  const saldo = await getSaldo();
  const alokasi = await getAlokasi();
  const investasi = await getInvestasi(saldo);
  const belanja_bulanan = await getBelanjaBulanan();
  const belanja_transaksi = await getBelanjaTransaksi();

  const jumlahAkun = (keys) =>
    saldo.filter((s) => keys.includes(s.akun)).reduce((sum, s) => sum + Number(s.saldo), 0);

  const totalLiquid = jumlahAkun(LIQUID);
  const totalDarurat = jumlahAkun(DARURAT);
  const totalAset = saldo.reduce((s, r) => s + Number(r.saldo), 0);

  return {
    saldo,
    alokasi,
    investasi,
    belanja_bulanan,
    belanja_transaksi,
    akun: AKUN,
    ringkasan: {
      total_liquid: totalLiquid,
      total_darurat: totalDarurat,
      total_investasi: investasi.total,
      total_aset: totalAset,
    },
  };
};

module.exports = {
  hitungAlokasi,
  createTransaksi,
  getAllTransaksi,
  getFilterOpsi,
  getTransaksiById,
  updateTransaksi,
  deleteTransaksi,
  getSaldo,
  getAlokasi,
  getAlokasiRiwayat,
  pindahAlokasi,
  deleteAlokasi,
  getInvestasi,
  getDashboard,
};
