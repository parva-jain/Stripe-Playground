require("dotenv").config();
const stripe = require("stripe")(process.env.STRIPE_KEY);
const { getPurchasablePlans } = require("./billing");
const { paymentPlans, ipfsPlans } = require("./paymentPlans");

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

async function fetchPlan(planType, subID) {
  const plans = planType === "Filecoin" ? paymentPlans : ipfsPlans;

  const plan = plans.find((elem) => elem.index === subID);
  if (!plan) {
    throw new CustomError(
      "InvalidPlanID",
      406,
      `No active Plan matches id:${subID}`
    );
  }
  return plan;
}

async function checkoutHandler(planType, subID, plan, customer, address) {
  const mode =
    planType === "Filecoin" && subID < 3 ? "payment" : "subscription";

  const priceDataObject = {
    currency: "usd",
    product_data: {
      name: `Lighthouse ${planType} Plan: ${plan.planName}`,
      description: `Lighthouse Topup storage: ${plan.storageInGB}GB \n Plus ${plan.bandwidthInGB}GB bandwidth`,
      metadata: { planID: plan.index, ...plan.detail },
    },
    unit_amount: plan.amount * 100,
    // recurring: {
    //   interval: "year",
    // },
  };

  if (mode == "subscription") {
    const frequency = planType === "Filecoin" ? "year" : "month";
    priceDataObject.recurring = {
      interval: frequency,
    };
  }
  const lineItemObject = {
    price_data: priceDataObject,
    quantity: 1,
  };

  const sessionObject = {
    payment_method_types: ["card"],
    phone_number_collection: {
      enabled: true,
    },
    mode: mode,
    // billing_address_collection: "auto",
    customer: customer.id,
    success_url: `http://localhost:3000/`,
    cancel_url: `http://localhost:3000/`,
    line_items: [lineItemObject],
  };

  sessionObject.metadata = {
    planID: plan.index,
    ...plan.detail,
    walletAddress: address,
  };

  if (mode == "payment") {
    sessionObject.invoice_creation = {
      enabled: true,
    };
  }
  return sessionObject;
}

exports.create_session_order = async (address, planType, subID, emailId) => {
  if (emailId === undefined) {
    throw new CustomError("Forbidden", 403, "Email not updated in profile");
  }
  // const plans = (await getPurchasablePlans()).activePurchasablePlans;
  const plans = planType === "Filecoin" ? paymentPlans : ipfsPlans;

  const plan = await fetchPlan(planType, subID);
  const customer = await upsertCustomer(address, emailId);

  // Check if the customer already has an active subscription
  // const subscriptions = await stripe.subscriptions.list({
  //   customer: customer.id,
  //   status: "active",
  //   limit: 1,
  // });

  // if (subscriptions.data.length > 0) {
  //   // Customer already has an active subscription, send them to biiling portal to manage subscription

  //   const stripeSession = await stripe.billingPortal.sessions.create({
  //     customer: customer.id,
  //     return_url: "http://localhost:3000/",
  //   });
  //   return { url: stripeSession.url };
  // }

  const sessionObject = await checkoutHandler(
    planType,
    subID,
    plan,
    customer,
    address
  );
  const session = await stripe.checkout.sessions.create(sessionObject);
  return { url: session.url };
};

// exports.create_invoice_order = async (address, emailId) => {
//   const customer = await upsertCustomer(address, emailId);

//   // Define customer ID, price IDs, and quantity of items
//   const customerId = customer.id;
//   const featurePriceId1 = "price_1Oes9qSIY6jqRpLu3G3SQ5ev";

//   const featureUsage1 = 2; // Replace with actual usage quantity

//   // Create an invoice
//   const invoice = await stripe.invoices.create({
//     customer: customerId,
//     collection_method: "send_invoice",
//     days_until_due: 30,
//   });

//   const invoiceItem = await stripe.invoiceItems.create({
//     customer: customerId,
//     price: featurePriceId1,
//     invoice: invoice.id,
//     description: "Additional charges for using premium features",
//   });

//   await stripe.invoices.sendInvoice(invoice.id);

//   // Log the payment intent details
//   console.log("Sent Invoice");

//   return { status: "success" };
// };
