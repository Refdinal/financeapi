const express = require("express");
const app = express();
const cors = require("cors");
require("dotenv").config();
const routerTransaksi = require("./routes/transaksiRoutes");
const routerYfinance = require("./routes/yfinanceRoutes");
app.use(cors());
app.use(express.json());

app.get("/ping", (req, res) => {
  res.json({ message: "Server is running!" });
});
app.use("/transaksi", routerTransaksi);
app.use("/yfinance", routerYfinance);
// listen port
const port = process.env.PORT || 8080; // Gunakan 8080 jika cPanel mendukung
app.listen(port, "0.0.0.0", () => {
  console.log(`Server running on port ${port}`);
});
