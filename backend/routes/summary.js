const express = require("express");
const router = express.Router();
const Transaction = require("../models/Transaction");

router.get("/", async (req, res) => {
  const tx = await Transaction.find();

  let totalIncome = 0;
  let totalExpenses = 0;

  for (const t of tx) {
    if (t.type === "income") totalIncome += t.amount;
    if (t.type === "expense") totalExpenses += t.amount;
  }

  res.json({
    totalIncome,
    totalExpenses,
    balance: totalIncome - totalExpenses
  });
});

module.exports = router;
