// src/services/CinetPayService.js
import axios from 'axios';
import crypto from 'crypto';

class CinetPayService {
  constructor() {
    this.apiKey = process.env.VITE_CINETPAY_API_KEY || process.env.CINETPAY_API_KEY;
    this.siteId = process.env.VITE_CINETPAY_SITE_ID || process.env.CINETPAY_SITE_ID;
    this.secretKey = process.env.VITE_CINETPAY_SECRET_KEY || process.env.CINETPAY_SECRET_KEY;
    this.notifyUrl = process.env.VITE_CINETPAY_NOTIFY_URL || process.env.CINETPAY_NOTIFY_URL;

    this.baseUrl = 'https://api-checkout.cinetpay.com/v2';
  }

  // Générer un ID de transaction unique (imprévisible)
  generateTransactionId(prefix = 'ORD') {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 9).toUpperCase();
    return `${prefix}-${timestamp}-${random}`;
  }

  // Initier un paiement
  async initiatePayment({
    amount, // en centimes (ex: 5000 = 50.00 XOF)
    transactionId,
    description,
    customerName,
    customerSurname = '',
    customerEmail,
    customerPhone,
    returnUrl,
    metadata = {},
  }) {
    try {
      const payload = {
        apikey: this.apiKey,
        site_id: this.siteId,
        transaction_id: transactionId,
        amount: amount.toString(),
        currency: 'XOF',
        description,
        customer_name: customerName,
        customer_surname: customerSurname,
        customer_email: customerEmail,
        customer_phone_number: customerPhone.replace(/[^0-9+]/g, ''), // nettoie le numéro
        customer_address: 'N/A',
        customer_city: 'Abidjan',
        customer_country: 'CI',
        customer_state: 'CI',
        customer_zip_code: '00225',
        notify_url: this.notifyUrl,
        return_url: returnUrl,
        channels: 'ALL',
        metadata: JSON.stringify(metadata),
        lang: 'fr',
      };

      const response = await axios.post(`${this.baseUrl}/payment`, payload, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 15000,
      });

      if (response.data.code === '201') {
        return {
          success: true,
          paymentUrl: response.data.data.payment_url,
          transactionId,
        };
      }

      return {
        success: false,
        message: response.data.message || 'Échec de l’initialisation',
      };
    } catch (error) {
      console.error('CinetPay Error:', error.response?.data || error.message);
      return {
        success: false,
        message: 'Service de paiement indisponible',
        error: error.response?.data || error.message,
      };
    }
  }

  // Vérifier le statut
  async checkPaymentStatus(transactionId) {
    try {
      const payload = {
        apikey: this.apiKey,
        site_id: this.siteId,
        transaction_id: transactionId,
      };

      const { data } = await axios.post(`${this.baseUrl}/payment/check`, payload, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 10000,
      });

      return {
        success: data.code === '00',
        status: data.data?.status || 'UNKNOWN',
        paid: data.data?.status === 'ACCEPTED',
        amount: data.data?.amount,
        paymentMethod: data.data?.payment_method,
        operator: data.data?.operator_id,
        message: data.message,
      };
    } catch (error) {
      console.error('Check status error:', error.response?.data || error.message);
      return { success: false, message: 'Impossible de vérifier le paiement' };
    }
  }

  // CRUCIAL : Vérifier la signature du webhook
  verifySignature(body) {
    const token = this.secretKey;
    const str = [
      body.cpm_trans_id,
      body.cpm_site_id,
      body.cpm_trans_date,
      body.cpm_amount,
      body.cpm_currency,
      body.cpm_payid,
      body.cpm_payment_date,
      body.cpm_payment_time,
      body.cpm_error_message,
      body.payment_method,
      body.cpm_phone_prefixe,
      body.cel_phone_num,
      body.cpm_ipn_ack,
      body.created_at,
      body.updated_at,
      body.cpm_result,
      body.cpm_designation,
      token,
    ].join('');

    const computed = crypto.createHash('sha256').update(str).digest('hex');
    return computed === body.signature;
  }
}

// Export unique instance
export default new CinetPayService();