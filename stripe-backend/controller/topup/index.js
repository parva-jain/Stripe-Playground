const { handleStripeWebhook } = require("./helper/stripeWebhook");
const {
  create_session_order,
  // create_invoice_order,
} = require("./helper/stripePayment");
require("dotenv").config();
const stripe = require("stripe")(process.env.STRIPE_KEY);
//   const { getActivePlanList, getPlanDetails } = require('./helper/plansHelper')
//   const { validateStripPayload } = require('./helper/stripe')

class CustomError extends Error {
  statusCode;
  errors;

  constructor(name, statusCode, errors) {
    super(`${name}`);
    this.name = name;
    this.statusCode = statusCode;
    this.errors = errors;

    Error.captureStackTrace(this, this.constructor);
  }

  serializeErrors() {
    return [{ message: this.errors }];
  }
}

exports.create_stripe_order = async (req, res, next) => {
  try {
    console.log(req.query.plan);
    console.log("plan ID : ", parseInt(req.query.subscriptionId));
    const data = await create_session_order(
      "0x0035cd0CA79A5b156d5443b698655DBDc5403B45",
      req.query.plan,
      parseInt(req.query.subscriptionId),
      "parvajain123@gmail.com"
    );
    res.status(200).json({ ...data });
  } catch (error) {
    console.log(error);
    /* istanbul ignore next */
    next(error);
  }
};

// exports.raiseInvoice = async (req, res, next) => {
//   try {
//     const data = await create_invoice_order(
//       "0x0035cd0CA79A5b156d5443b698655DBDc5403B45",
//       "parvajainpjjp@gmail.com"
//     );
//     res.status(200).json({ ...data });
//   } catch (error) {
//     console.log(error);
//     /* istanbul ignore next */
//     next(error);
//   }
// };

exports.webhook_stripe = async (req, res, next) => {
  try {
    await handleStripeWebhook(req);
    res.status(200).json({ Success: "true" });
  } catch (error) {
    console.log(error);
    /* istanbul ignore next */
    next(error);
  }
};
