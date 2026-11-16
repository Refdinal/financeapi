const model = require("../models/wishlistModels");

const getWishlist = async (req, res) => {
  try {
    const wishlist = await model.getWishlist();
    return res.status(200).json({ status: "success", ...wishlist });
  } catch (error) {
    return res.status(400).json({ status: "error", message: error.message });
  }
};

const createWishlist = async (req, res) => {
  try {
    const item = await model.createWishlist(req.body);
    return res.status(201).json({ status: "success", item });
  } catch (error) {
    return res.status(400).json({ status: "error", message: error.message });
  }
};

const updateWishlist = async (req, res) => {
  try {
    const item = await model.updateWishlist(req.params.id, req.body);
    return res.status(200).json({ status: "success", item });
  } catch (error) {
    return res.status(400).json({ status: "error", message: error.message });
  }
};

const deleteWishlist = async (req, res) => {
  try {
    const id = await model.deleteWishlist(req.params.id);
    return res.status(200).json({ status: "success", id });
  } catch (error) {
    return res.status(400).json({ status: "error", message: error.message });
  }
};

module.exports = { getWishlist, createWishlist, updateWishlist, deleteWishlist };
