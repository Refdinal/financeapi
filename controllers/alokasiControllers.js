const model = require("../models/transaksiModels");
const { AKUN } = require("../config/keuangan");

const getAlokasi = async (req, res) => {
  try {
    const [alokasi, saldo] = await Promise.all([model.getAlokasi(), model.getSaldo()]);
    const total_liquid = saldo
      .filter((s) => AKUN.liquid.includes(s.akun))
      .reduce((sum, s) => sum + Number(s.saldo), 0);
    return res.status(200).json({ status: "success", alokasi, total_liquid });
  } catch (error) {
    return res.status(400).json({ status: "error", message: error.message });
  }
};

const getAlokasiRiwayat = async (req, res) => {
  try {
    const riwayat = await model.getAlokasiRiwayat(req.params.limit || 50);
    return res.status(200).json({ status: "success", riwayat });
  } catch (error) {
    return res.status(400).json({ status: "error", message: error.message });
  }
};

const deleteAlokasi = async (req, res) => {
  try {
    const deleted = await model.deleteAlokasi(req.params.id);
    return res.status(200).json({ status: "success", deleted });
  } catch (error) {
    return res.status(400).json({ status: "error", message: error.message });
  }
};

const pindahAlokasi = async (req, res) => {
  try {
    const result = await model.pindahAlokasi(req.body);
    return res.status(200).json({ status: "success", result });
  } catch (error) {
    return res.status(400).json({ status: "error", message: error.message });
  }
};

module.exports = { getAlokasi, getAlokasiRiwayat, pindahAlokasi, deleteAlokasi };
