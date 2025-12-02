// utils/paypal.js
const axios = require("axios");

const PAYPAL_API =
  process.env.PAYPAL_MODE === "live"
    ? "https://api-m.paypal.com"
    : "https://api-m.sandbox.paypal.com";

async function getAccessToken() {
  const auth = Buffer.from(
    `${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_CLIENT_SECRET}`
  ).toString("base64");

  const response = await axios.post(
    `${PAYPAL_API}/v1/oauth2/token`,
    "grant_type=client_credentials",
    {
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
    }
  );
  return response.data.access_token;
}

async function createOrder(
  amount,
  currency = "USD",
  description = "Quyên góp y tế từ thiện",
  customId
) {
  const accessToken = await getAccessToken();

  const orderData = {
    intent: "CAPTURE",
    purchase_units: [
      {
        amount: {
          currency_code: currency,
          value: amount.toFixed(2),
        },
        description,
        custom_id: customId, // dùng txnRef của bạn
        soft_descriptor: "Y Te Tu Thien",
      },
    ],
    application_context: {
      brand_name: "Quỹ Y Tế Từ Thiện",
      landing_page: "BILLING",
      user_action: "PAY_NOW",
      return_url: `${
        process.env.FRONTEND_URL || "http://localhost:3000"
      }/donation-success?txnRef=${encodeURIComponent(customId)}`,
      cancel_url: `${
        process.env.FRONTEND_URL || "http://localhost:3000"
      }/donation-failure`,
    },
  };

  const response = await axios.post(
    `${PAYPAL_API}/v2/checkout/orders`,
    orderData,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        "PayPal-Request-Id": customId, // chống duplicate
      },
    }
  );

  return response.data;
}

async function captureOrder(orderId) {
  const accessToken = await getAccessToken();
  const response = await axios.post(
    `${PAYPAL_API}/v2/checkout/orders/${orderId}/capture`,
    {},
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    }
  );
  return response.data;
}

module.exports = { createOrder, captureOrder, getAccessToken };
