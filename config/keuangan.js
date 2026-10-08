// Konfigurasi domain keuangan (hardcoded, mudah diubah).

const AKUN = {
  liquid: ["bri", "nagari", "ovo", "cash"],
  darurat: ["bca"],
  investasi: ["bitcoin", "saham", "reksadana"],
};

const SEMUA_AKUN = [...AKUN.liquid, ...AKUN.darurat, ...AKUN.investasi];

// Pos alokasi + persen. Total persen = 100.
const ALOKASI = [
  { key: "rumah_tangga", label: "Rumah Tangga", persen: 40 },
  { key: "istri", label: "Istri", persen: 20 },
  { key: "pribadi", label: "Pribadi", persen: 20 },
  { key: "investasi", label: "Investasi", persen: 10 },
  { key: "dana_darurat", label: "Dana Darurat", persen: 5 },
  { key: "amal", label: "Amal", persen: 5 },
];

const TIPE = [
  { key: "pendapatan", label: "Pendapatan" },
  { key: "pengeluaran", label: "Pengeluaran" },
  { key: "pemindahan", label: "Pemindahan" },
  { key: "masuk_investasi", label: "Masuk Investasi" },
  { key: "tarik_investasi", label: "Tarik Investasi" },
];

const KATEGORI = [
  { key: "belanja", label: "Belanja" },
  { key: "amal", label: "Amal" },
];

const TUJUAN_BELANJA = ["sandang", "pangan", "papan", "sekunder", "tersier"];
const TUJUAN_AMAL = ["istri", "sedekah"];

// Sumber pos alokasi yang boleh dipilih saat kategori Amal.
const SUMBER_AMAL = ["rumah_tangga", "istri", "amal"];

const JENIS_PENDAPATAN = ["utama", "sampingan"];

// Akun tujuan pendapatan utama (wajib nagari).
const TUJUAN_PENDAPATAN_UTAMA = "nagari";

module.exports = {
  AKUN,
  SEMUA_AKUN,
  ALOKASI,
  TIPE,
  KATEGORI,
  TUJUAN_BELANJA,
  TUJUAN_AMAL,
  SUMBER_AMAL,
  JENIS_PENDAPATAN,
  TUJUAN_PENDAPATAN_UTAMA,
};
