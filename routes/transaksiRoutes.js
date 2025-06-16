const express = require("express");
const transaksiControllers = require("../controllers/transaksiControllers");
const routerTransaksi = express.Router();

routerTransaksi.get("/alltransaksi/:limit", transaksiControllers.getAllTransaksi);
routerTransaksi.get("/id/:id", transaksiControllers.getTransaksiById);
routerTransaksi.post("/inserttransaksi", transaksiControllers.insertTransaksi);
routerTransaksi.put("/update/:id", transaksiControllers.updateTransaksi);
routerTransaksi.delete("/delete/:id", transaksiControllers.deleteTransaksiById);
routerTransaksi.get("/totalSaldo", transaksiControllers.getTotalSaldo);
routerTransaksi.get("/liquid", transaksiControllers.getLiquid);
routerTransaksi.get("/investasi", transaksiControllers.getInvestasi);
routerTransaksi.get("/akunInvestasi", transaksiControllers.getAkunInvestasi);
routerTransaksi.get("/belanjaBulanan", transaksiControllers.getBelanjaBulanan);

module.exports = routerTransaksi;
