const express = require("express");
const {
  //   record_transaction,
  //   create_subdomain,
  //   check_subdomain,
  //   get_active_plan_list,
  //   get_subdomain,
  //   get_user_transactions,
  //   plan_details_by_id,
  create_stripe_order,
} = require("../controller/topup");

const router = express.Router();

router.get("/purchase_plan_via_stripe", create_stripe_order);

module.exports = router;
