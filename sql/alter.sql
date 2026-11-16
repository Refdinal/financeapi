-- alter.sql
-- Riwayat perubahan skema (APPEND-ONLY).
--
-- Aturan:
--   - JANGAN menghapus atau mengubah statement yang sudah ada di file ini.
--   - JANGAN memakai DROP TABLE / TRUNCATE / DELETE tanpa WHERE.
--   - Tambahkan statement ALTER/CREATE baru di bagian bawah file.
--   - Gunakan IF NOT EXISTS bila tersedia agar aman dijalankan ulang.
--
-- Skema final (transaksi & alokasi) ada di schema.sql. Tidak ada perubahan tertunda.

-- 2026-09-24: centang "ubah alokasi" per transaksi.
-- true (default) = transaksi memengaruhi tabel alokasi; false = tidak.
ALTER TABLE transaksi ADD COLUMN IF NOT EXISTS ubah_alokasi BOOLEAN DEFAULT TRUE;

-- 2026-11-16: daftar target wishlist.
CREATE TABLE IF NOT EXISTS wishlist (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nama TEXT NOT NULL,
    target NUMERIC(14, 2) NOT NULL CHECK (target > 0),
    catatan TEXT,
    dibuat_pada TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_wishlist_dibuat_pada ON wishlist (dibuat_pada);
