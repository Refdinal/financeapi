-- Skema "Idle Finance" (schema final: hanya tabel transaksi & alokasi).
-- File ini idempotent (CREATE TABLE IF NOT EXISTS) dan TIDAK menghapus data.
-- Jangan tambahkan statement DROP di file ini.

CREATE TABLE IF NOT EXISTS transaksi (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    grup_id UUID,
    tanggal TIMESTAMP,
    tipe TEXT,
    arah TEXT,
    kategori TEXT,
    asal TEXT,
    tujuan TEXT,
    deskripsi TEXT,
    jumlah NUMERIC,
    ubah_alokasi BOOLEAN DEFAULT TRUE
);

CREATE INDEX IF NOT EXISTS idx_transaksi_tanggal ON transaksi (tanggal);
CREATE INDEX IF NOT EXISTS idx_transaksi_tipe ON transaksi (tipe);
CREATE INDEX IF NOT EXISTS idx_transaksi_asal ON transaksi (asal);
CREATE INDEX IF NOT EXISTS idx_transaksi_tujuan ON transaksi (tujuan);
CREATE INDEX IF NOT EXISTS idx_transaksi_grup ON transaksi (grup_id);

CREATE TABLE IF NOT EXISTS alokasi (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transaksi_id UUID REFERENCES transaksi(id) ON DELETE CASCADE,
    tanggal TIMESTAMP,
    jenis TEXT,
    alokasi TEXT,
    jumlah NUMERIC
);

CREATE INDEX IF NOT EXISTS idx_alokasi_transaksi ON alokasi (transaksi_id);
CREATE INDEX IF NOT EXISTS idx_alokasi_alokasi ON alokasi (alokasi);
