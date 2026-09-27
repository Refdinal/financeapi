const express = require("express");
const c = require("../controllers/alokasiControllers");
const routerAlokasi = express.Router();

routerAlokasi.get("/", c.getAlokasi);
routerAlokasi.get("/riwayat/:limit", c.getAlokasiRiwayat);
routerAlokasi.post("/pindah", c.pindahAlokasi);
routerAlokasi.delete("/riwayat/:id", c.deleteAlokasi);

module.exports = routerAlokasi;
