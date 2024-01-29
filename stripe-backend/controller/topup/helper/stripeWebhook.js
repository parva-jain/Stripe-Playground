require("dotenv").config();
const stripe = require("stripe")(process.env.STRIPE_KEY);

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

const processStripePayment = async (data, eventType) => {
  switch (eventType) {
    case "checkout.session.completed":
      try {
        const invoiceMetadata = data.invoice_creation.invoice_data.metadata;

        // Check type of wallet
        // const network = getNetwork(invoiceMetadata.walletAddress)
        // if (network === 'evm') {
        //   invoiceMetadata.walletAddress =
        //     invoiceMetadata.walletAddress.toLowerCase()
        // }

        // Add transaction to DB
        // await recordTransactions({
        //   id: v4().toString(),
        //   txHash: data.id,
        //   publicKey: invoiceMetadata.walletAddress,
        //   tokenAddress: 'Fiat Payment',
        //   subscriptionID: invoiceMetadata.planID.toString(),
        //   amount: invoiceMetadata.amount,
        //   network: 'stripe',
        //   createdAt: Date.now(),
        // })

        //Add paid data cap to DB
        const dataCapPurchased =
          parseInt(`${invoiceMetadata.storageInGB ?? 0}`, 10) * 1073741824; //GB converted to bytes
        if (dataCapPurchased) {
          //   await updateUserDataLimit(
          //     invoiceMetadata.walletAddress,
          //     dataCapPurchased
          //   )
          console.log("plan updated");
        }
      } catch (err) {
        throw new CustomError(`${err.message}`, 406, err);
      }
      break;

    // Handle other cases

    default:
      console.log(`Unhandled event type ${eventType}`);
  }
};

const validateStripePayload = async (req) => {
  const webhookSecret = process.env.STRIPE_WEBHOOK;
  let event;
  if (webhookSecret) {
    try {
      event = await stripe.webhooks.constructEvent(
        req.body,
        req.headers["stripe-signature"],
        webhookSecret,
        undefined
      );
      return { data: event.data.object, eventType: event.type };
    } catch (err) {
      console.log(`⚠️  Webhook signature verification failed:  ${err}`);
      throw new CustomError(`webhook error`, 400, err);
    }
  }
  return { data: null, eventType: null };
};

exports.handleStripeWebhook = async (req) => {
  const { data: stripeData, eventType } = await validateStripePayload(req);
  await processStripePayment(stripeData, eventType);
};
