const express = require("express");
const { webhook_stripe } = require("../controller/topup");

const router = express.Router();

router.post(
  "/stripe",
  express.raw({ type: "application/json" }),
  webhook_stripe
);

module.exports = router;
