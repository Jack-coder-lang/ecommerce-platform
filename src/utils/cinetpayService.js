const axios = require('axios');
const crypto = require('crypto');

const CINETPAY_BASE_URL = 'https://api-checkout.cinetpay.com/v2';

// Générer un ID de transaction unique
exports.generateTransactionId = () => {
  return `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
};

// Initialiser un paiement
exports.initializePayment = async (orderData) => {
  try {
    const data = {
      apikey: process.env.CINETPAY_API_KEY,
      site_id: process.env.CINETPAY_SITE_ID,
      transaction_id: orderData.transactionId,
      amount: orderData.amount, // doit être un INTEGER (ex: 5000 pour 50.00 XOF)
      currency: 'XOF',
      description: orderData.description,
      customer_id: orderData.customerId,
      customer_name: orderData.customerName,
      customer_surname: orderData.customerSurname || '',
      customer_email: orderData.customerEmail,
      customer_phone_number: orderData.customerPhone,
      customer_address: orderData.customerAddress || '',
      customer_city: orderData.customerCity || '',
      customer_country: orderData.customerCountry || 'CI',
      customer_state: orderData.customerState || '',
      customer_zip_code: orderData.customerZipCode || '',
      notify_url: process.env.CINETPAY_NOTIFY_URL,
      return_url: orderData.returnUrl, // page de retour après paiement
      channels: 'ALL',
      lang: 'fr',
      metadata: JSON.stringify(orderData.metadata || {}),
    };

    const response = await axios.post(`${CINETPAY_BASE_URL}/payment`, data, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 10000,
    });

    if (response.data.code !== '00') {
      throw new Error(response.data.message || 'Échec initialisation paiement');
    }

    return {
      success: true,
      paymentUrl: response.data.payment_url,
      transactionId: orderData.transactionId,
    };
  } catch (error) {
    console.error('Erreur CinetPay init:', error.response?.data || error.message);
    throw new Error('Impossible d\'initialiser le paiement');
  }
};

// Vérifier statut
exports.checkPaymentStatus = async (transactionId) => {
  try {
    const data = {
      apikey: process.env.CINETPAY_API_KEY,
      site_id: process.env.CINETPAY_SITE_ID,
      transaction_id: transactionId,
    };

    const response = await axios.post(`${CINETPAY_BASE_URL}/payment/check`, data, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 10000,
    });

    return response.data;
  } catch (error) {
    console.error('Erreur check status:', error.response?.data || error.message);
    throw error;
  }
};

// Vérifier signature (SÉCURITÉ CRITIQUE !)
exports.verifyNotificationSignature = (body) => {
  const token = process.env.CINETPAY_SECRET_KEY;

  // CinetPay envoie TOUJOURS ces champs
  const str = 
    body.cpm_trans_id +
    body.cpm_site_id +
    body.cpm_trans_date +
    body.cpm_amount +
    body.cpm_currency +
    body.cpm_payid +
    body.cpm_payment_date +
    body.cpm_payment_time +
    body.cpm_error_message +
    body.payment_method +
    body.cpm_phone_prefixe +
    body.cel_phone_num +
    body.cpm_ipn_ack +
    body.created_at +
    body.updated_at +
    body.cpm_result +
    body.cpm_designation +
    token;

  const computed = crypto.createHash('sha256').update(str).digest('hex');
  return computed === body.signature;
};