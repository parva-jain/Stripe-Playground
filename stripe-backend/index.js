const cors = require("cors");
const express = require("express");
const bodyParser = require("body-parser");
const TopUpRouter = require("./routes/topup");
const WebhookRouter = require("./routes/stripeWebhook");
require("dotenv").config();
const stripe = require("stripe")(process.env.STRIPE_KEY);

const { v4: uuidv4 } = require("uuid");
const app = express();
app.use(bodyParser.urlencoded({ extended: false }));
app.use("/api/webhook", WebhookRouter);

app.use(bodyParser.json());

app.use(express.json());
app.use(cors());

app.get("/", (req, res) => {
  res.send("It works");
});

app.use("/api/topup", TopUpRouter);

// app.post("/payment", (req, res) => {
//   const { product, token } = req.body;
//   console.log({ product });
//   console.log("Price : " + product.price);
//   const idempontencyKey = uuidv4();
//   return stripe.customers
//     .create({
//       email: token.email,
//       source: token.id,
//     })
//     .then((customer) => {
//       stripe.charges.create(
//         {
//           amount: product.price * 100,
//           currency: "usd",
//           customer: customer.id,
//           receipt_email: token.email,
//           description: `puchase of ${product.name}`,
//           shipping: {
//             name: token.card.name,
//             address: {
//               country: token.card.address_country,
//             },
//           },
//         },
//         { idempontencyKey }
//       );
//     })
//     .then((result) => res.status(200).json(result))
//     .catch((err) => console.log(err));
// });

app.listen(8282, () => console.log("Listening on port 8282"));
