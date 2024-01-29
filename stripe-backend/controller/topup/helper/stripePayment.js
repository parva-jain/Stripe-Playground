require("dotenv").config();
const stripe = require("stripe")(process.env.STRIPE_KEY);
const { getPurchasablePlans } = require("./billing");

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

async function upsertCustomer(walletAddress, email) {
  // Search for customers with the given userId in metadata
  const existingCustomers = await stripe.customers.list({
    email: email,
  });

  let customer;

  if (existingCustomers.data.length > 0) {
    // Customer exists, update if necessary
    customer = existingCustomers.data[0];
    // Here you can add code to update the customer if needed
  } else {
    // No customer found, create a new one
    customer = await stripe.customers.create({
      email: email,
      metadata: { walletAddress },
    });
  }

  return customer;
}

exports.create_session_order = async (address, subID, emailId) => {
  if (emailId === undefined) {
    throw new CustomError("Forbidden", 403, "Email not updated in profile");
  }
  const plans = (await getPurchasablePlans()).activePurchasablePlans;

  const plan = plans.find((elem) => elem.index === subID);
  if (!plan) {
    throw new CustomError(
      "InvalidPlanID",
      406,
      `No active Plan matches id:${subID}`
    );
  }
  const customer = await upsertCustomer(address, emailId);

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    phone_number_collection: {
      enabled: true,
    },
    invoice_creation: {
      enabled: true,
      invoice_data: {
        metadata: {
          planID: plan.index,
          ...plan.detail,
          walletAddress: address,
        },
      },
    },
    line_items: [
      {
        price_data: {
          currency: "usd",
          product_data: {
            name: `Lighthouse Plan: ${plan.detail.planName}`,
            description: `Lighthouse Topup storage: ${plan.detail.storageInGB}GB \n Plus ${plan.detail.bandwidthInGB}GB bandwidth`,
            metadata: { planID: plan.index, ...plan.detail },
          },
          unit_amount: plan.amount / 1e4,
        },
        quantity: 1,
      },
    ],
    mode: "payment",
    customer: customer.id,
    // customer_email: emailId,
    success_url: `http://localhost:3000/`,
    cancel_url: `http://localhost:3000/`,
  });
  return { url: session.url };
};
