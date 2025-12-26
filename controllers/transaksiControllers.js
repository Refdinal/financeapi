const transaksiModels = require("../models/transaksiModels");
const dayjs = require("dayjs");
const utc = require("dayjs/plugin/utc");
const tz = require("dayjs/plugin/timezone");

dayjs.extend(utc);
dayjs.extend(tz);

const getAllTransaksi = async (req, res) => {
  try {
    const limit = req.params.limit;
    const transaksi = await transaksiModels.getAllTransaksi(limit);

    return res.status(200).json({
      status: "success",
      transaksi: transaksi,
    });
  } catch (error) {
    return res.status(400).json({
      status: "error",
      message: error.message,
    });
  }
};
const getTransaksiById = async (req, res) => {
  try {
    const id = req.params.id;
    const transaksi = await transaksiModels.getTransaksiById(id);
    return res.status(200).json({
      status: "success",
      transaksi: transaksi,
    });
  } catch (error) {
    return res.status(400).json({
      status: "error",
      message: error.message,
    });
  }
};

const insertTransaksi = async (req, res) => {
  try {
    const { tanggal, tipe, asal, tujuan, kategori, deskripsi, jumlah } = req.body;
    const transaksi = await transaksiModels.insertTransaksi(tanggal, tipe, asal, tujuan, kategori, deskripsi, jumlah);
    return res.status(200).json({
      status: "success",
      transaksi: transaksi,
    });
  } catch (error) {
    return res.status(400).json({
      status: "error",
      message: error.message,
    });
  }
};

const updateTransaksi = async (req, res) => {
  try {
    const id = req.params.id;
    const { tanggal, tipe, asal, tujuan, kategori, deskripsi, jumlah } = req.body;
    const transaksi = await transaksiModels.updateTransaksi(
      id,
      tanggal,
      tipe,
      asal,
      tujuan,
      kategori,
      deskripsi,
      jumlah
    );
    return res.status(200).json({
      status: "success",
      transaksi: transaksi,
    });
  } catch (error) {
    return res.status(400).json({
      status: "error",
      message: error.message,
    });
  }
};
const deleteTransaksiById = async (req, res) => {
  try {
    const id = req.params.id;
    const transaksi = await transaksiModels.deleteTransaksiById(id);
    return res.status(200).json({
      status: "success",
      transaksi: transaksi,
    });
  } catch (error) {
    return res.status(400).json({
      status: "error",
      message: error.message,
    });
  }
};
const getTotalSaldo = async (req, res) => {
  try {
    const totalSaldo = await transaksiModels.getTotalSaldo();
    return res.status(200).json({
      status: "success",
      totalSaldo: totalSaldo,
    });
  } catch (error) {
    return res.status(400).json({
      status: "error",
      message: error.message,
    });
  }
};
const getLiquid = async (req, res) => {
  try {
    const liquid = await transaksiModels.getLiquid();
    return res.status(200).json({
      status: "success",
      liquid: liquid,
    });
  } catch (error) {
    return res.status(400).json({
      status: "error",
      message: error.message,
    });
  }
};

const getInvestasi = async (req, res) => {
  try {
    const investasi = await transaksiModels.getInvestasi();
    return res.status(200).json({
      status: "success",
      investasi: investasi,
    });
  } catch (error) {
    return res.status(400).json({
      status: "error",
      message: error.message,
    });
  }
};
const getAkunInvestasi = async (req, res) => {
  try {
    const akunInvestasi = await transaksiModels.getAkunInvestasi();
    return res.status(200).json({
      status: "success",
      akunInvestasi: akunInvestasi,
    });
  } catch (error) {
    return res.status(400).json({
      status: "error",
      message: error.message,
    });
  }
};
const getBelanjaBulanan = async (req, res) => {
  try {
    const belanjaBulanan = await transaksiModels.getBelanjaBulanan();
    return res.status(200).json({
      status: "success",
      belanjaBulanan: belanjaBulanan,
    });
  } catch (error) {
    return res.status(400).json({
      status: "error",
      message: error.message,
    });
  }
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
