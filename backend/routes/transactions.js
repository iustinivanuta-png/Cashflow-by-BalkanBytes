const express = require("express");
const router = express.Router();
const Transaction = require("../models/Transaction");

// ADD transaction
router.post("/", async (req, res) => {
  try {
    const transaction = await Transaction.create(req.body);
    res.json(transaction);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// GET all transactions
router.get("/", async (req, res) => {
  const transactions = await Transaction.find().sort({ date: -1 });
  res.json(transactions);
});

// DELETE by id
const mongoose = require("mongoose");

// DELETE by id
router.delete("/:id", async (req, res) => {
  try {
    const raw = String(req.params.id);

    // extrage primul ObjectId valid din raw
    const match = raw.match(/[a-fA-F0-9]{24}/);
    const id = match ? match[0] : null;

    if (!id) {
      return res.status(400).json({ error: "Invalid id format", received: raw });
    }

    const deleted = await Transaction.findByIdAndDelete(id);
    if (!deleted) return res.status(404).json({ error: "Not found", id });

    res.json({ ok: true, id });
  } catch (err) {
    res.status(400).json({ error: err.message, received: req.params.id });
  }
});



// UPDATE by id
router.put("/:id", async (req, res) => {
  try {
    const updated = await Transaction.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});
module.exports = router;

