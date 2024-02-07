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
    case "customer.created":
      console.log(
        `New customer created with customer id ${data.id} for email ${data.email}`
      );
    // Add info to DB

    case "checkout.session.completed":
      try {
        const metadata = data.metadata;
        const id = data.id;
        const customer = data.customer;
        if (data.mode == "payment") {
          console.log("Successfully completed payment for Lifetime plan");
        } else if (data.mode == "subscription") {
          console.log(
            "Successfully received first subscription payment for Annual plan"
          );
        }
        // Check type of wallet
        // const network = getNetwork(metadata.walletAddress)
        // if (network === 'evm') {
        //   metadata.walletAddress =
        //     metadata.walletAddress.toLowerCase()
        // }

        // Add transaction to DB
        // await recordTransactions({
        //   id: v4().toString(),
        //   txHash: data.id,
        //   publicKey: metadata.walletAddress,
        //   tokenAddress: 'Fiat Payment',
        //   subscriptionID: metadata.planID.toString(),
        //   amount: metadata.amount,
        //   network: 'stripe',
        //   createdAt: Date.now(),
        // })

        // Add paid data cap to DB
        // const dataCapPurchased =
        //   parseInt(`${invoiceMetadata.storageInGB ?? 0}`, 10) * 1073741824; //GB converted to bytes
        // if (dataCapPurchased) {
        //   await updateUserDataLimit(
        //     metadata.walletAddress,
        //     dataCapPurchased
        //   )
        console.log("Plan Purchased, Updating the User Data cap...");
      } catch (err) {
        throw new CustomError(`${err.message}`, 406, err);
      }
      break;

    case "invoice.payment_succeeded":
      const invoice = data;

      // On payment successful, get subscription and customer details
      const subscription = await stripe.subscriptions.retrieve(
        data.subscription
      );
      const customer = await stripe.customers.retrieve(data.customer);

      if (
        invoice.billing_reason === "subscription_cycle" ||
        invoice.billing_reason === "subscription_update"
      ) {
        console.log(
          `Recurring subscription payment successful for Invoice ID: ${invoice.id}`
        );
      }

      console.log("Updating Transactions Record...");
      break;

    // case "customer.subscription.updated": {
    //   const subscription = data;
    //   // console.log(event);
    //   if (subscription.cancel_at_period_end) {
    //     console.log(`Subscription ${subscription.id} was canceled.`);
    //     // DB code to update the customer's subscription status in your database
    //   } else {
    //     console.log(`Subscription ${subscription.id} was restarted.`);
    //     // get subscription details and update the DB
    //   }
    //   break;
    // }

    // Handle other cases

    default:
      console.log(`Unhandled event type ${eventType}`);
      console.log("Event Object ", data);
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
