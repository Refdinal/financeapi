
CREATE TABLE transaksi (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tanggal TIMESTAMP,
    tipe TEXT,
    asal TEXT,
    tujuan TEXT,
    kategori TEXT,
    deskripsi TEXT,
    jumlah NUMERIC
);
CREATE INDEX idx_transaksi_asal ON transaksi (asal);
CREATE INDEX idx_transaksi_tujuan ON transaksi (tujuan);
CREATE INDEX idx_transaksi_tanggal ON transaksi (tanggal);
CREATE INDEX idx_transaksi_tipe ON transaksi (tipe);
CREATE INDEX idx_transaksi_kategori ON transaksi (kategori);

INSERT INTO transaksi (tanggal, tipe, asal, tujuan, kategori, deskripsi, jumlah) VALUES
-- Pemasukan
('2025-05-31 08:00:00', 'pemasukan', 'Saldo Awal', 'Rekening BCA', 'Pendapatan Lain', 'Saldo Awal BCA', 6155861.98),
('2025-05-31 08:00:00', 'pemasukan', 'Saldo Awal', 'Rekening BRI', 'Pendapatan Lain', 'Saldo Awal BRI', 3567796),
('2025-05-31 08:00:00', 'pemasukan', 'Saldo Awal', 'OVO', 'Pendapatan Lain', 'Saldo Awal OVO', 22001),
('2025-05-31 08:30:00', 'pemasukan', 'Saldo Awal', 'Cash', 'Pendapatan Lain', 'Saldo Awal Cash', 621000),
('2025-05-31 09:00:00', 'pengeluaran', 'Rekening BCA', 'Pluang', 'Investasi', 'Deposit Investasi', 2624807),
('2025-06-1 08:00:00', 'pengeluaran', 'Cash', 'Belanja', 'Transportasi', 'Bensin', 20000),
('2025-06-1 08:00:00', 'pengeluaran', 'Cash', 'Belanja', 'Kesehatan', 'Masker', 5000),
('2025-06-1 08:00:00', 'pengeluaran', 'Cash', 'Belanja', 'Makan', 'Nasi Bungkus dan Lauk', 87000),
('2025-06-1 08:00:00', 'pengeluaran', 'Cash', 'Belanja', 'Peralatan', 'Obeng', 15000),
('2025-06-1 08:00:00', 'pengeluaran', 'Rekening BCA', 'Cash', 'Tarik Tunai', 'Tarik Tunai', 1000000),
('2025-06-1 08:00:00', 'pemasukan', 'Rekening BCA', 'Cash', 'Tarik Tunai', 'Tarik Tunai', 1000000)


tipe = pemasukan, pengeluaran
asal = rekening bca, rekening bri, rekening nagari, ovo, cash, pendapatan investasi, pendapatan lain
tujuan = rekening bca, rekening bri, rekening nagari, ovo, cash, pluang, ipot , belanja
kategori = pemindahan , investasi , pencairan, laba investasi , sandang, pangan , papan, sekunder, tersier