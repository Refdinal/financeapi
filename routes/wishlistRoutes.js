const express = require("express");
const c = require("../controllers/wishlistControllers");
const routerWishlist = express.Router();

routerWishlist.get("/", c.getWishlist);
routerWishlist.post("/", c.createWishlist);
routerWishlist.put("/:id", c.updateWishlist);
routerWishlist.delete("/:id", c.deleteWishlist);

module.exports = routerWishlist;
