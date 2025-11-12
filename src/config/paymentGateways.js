// src/config/paymentGateways.js
export const PAYMENT_GATEWAYS = {
  CINETPAY: {
    name: "CinetPay",
    enabled: true,
    apiKey: import.meta.env.VITE_CINETPAY_API_KEY,
    siteId: import.meta.env.VITE_CINETPAY_SITE_ID,
    secretKey: import.meta.env.VITE_CINETPAY_SECRET_KEY,
    notifyUrl: import.meta.env.VITE_CINETPAY_NOTIFY_URL,
    baseUrl: "https://api-checkout.cinetpay.com/v2",
    currencies: ["XOF"],
  },

  ORANGE_MONEY: {
    name: "Orange Money",
    enabled: true,
    merchantKey: import.meta.env.VITE_ORANGE_MONEY_MERCHANT_KEY,
    apiUsername: import.meta.env.VITE_ORANGE_MONEY_USERNAME,
    apiPassword: import.meta.env.VITE_ORANGE_MONEY_PASSWORD,
    returnUrl: import.meta.env.VITE_ORANGE_MONEY_RETURN_URL,
    notifyUrl: import.meta.env.VITE_ORANGE_MONEY_NOTIFY_URL,
    baseUrl: "https://api.orange.com/orange-money-webpay/ci/v1/webpayment",
    currencies: ["XOF"],
  },

  WAVE: {
    name: "Wave",
    enabled: true,
    apiKey: import.meta.env.VITE_WAVE_API_KEY,
    secretKey: import.meta.env.VITE_WAVE_SECRET_KEY,
    baseUrl: "https://api.wave.com/v1",
    currencies: ["XOF"],
  },

  MTN_MOMO: {
    name: "MTN MoMo",
    enabled: true,
    subscriptionKey: import.meta.env.VITE_MTN_SUBSCRIPTION_KEY,
    apiKey: import.meta.env.VITE_MTN_API_KEY,
    environment: "sandbox", // ou "production"
    baseUrl: "https://proxy.momoapi.mtn.com",
    currencies: ["XOF", "XAF"],
  },
};