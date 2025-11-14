// src/controllers/payment.controller.js
import axios from 'axios';
import prisma from '../config/database.js';

const CINETPAY_API_URL = 'https://api-checkout.cinetpay.com/v2/payment';
const CINETPAY_CHECK_URL = 'https://api-checkout.cinetpay.com/v2/payment/check';

// Générer un ID de transaction unique
const generateTransactionId = () => {
  return `TXN${Date.now()}${Math.floor(Math.random() * 100000)}`;
};

/**
 * Initialiser un paiement CinetPay
 */
export const initializePayment = async (req, res) => {
  try {
    const {
      orderId,
      amount,
      currency = 'XOF',
      channels = 'ALL',
      customer
    } = req.body;

    console.log('🔵 Initialisation paiement CinetPay:', { orderId, amount, currency, channels });

    // Validation
    if (!orderId || !amount || !customer) {
      console.error('❌ Paramètres manquants:', { orderId, amount, customer: !!customer });
      return res.status(400).json({
        success: false,
        message: 'Paramètres manquants: orderId, amount, customer requis'
      });
    }

    // Vérifier que la commande existe
    console.log('🔍 Recherche de la commande:', orderId);
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { user: true }
    });

    if (!order) {
      console.error('❌ Commande non trouvée:', orderId);
      return res.status(404).json({
        success: false,
        message: 'Commande non trouvée'
      });
    }

    console.log('✅ Commande trouvée:', { id: order.id, userId: order.userId, total: order.total });

    // Générer un transaction_id unique
    const transactionId = generateTransactionId();

    // Préparer les données pour CinetPay
    const paymentData = {
      apikey: process.env.CINETPAY_API_KEY,
      site_id: process.env.CINETPAY_SITE_ID,
      transaction_id: transactionId,
      amount: Math.round(amount), // Doit être un entier et multiple de 5
      currency: currency,
      description: `Paiement commande #${orderId}`,
      notify_url: process.env.CINETPAY_NOTIFY_URL || `${process.env.BACKEND_URL}/api/payments/cinetpay/notify` || 'https://ecommerce-backend-deploy.vercel.app/api/payments/cinetpay/notify',
      return_url: (process.env.CINETPAY_RETURN_URL || `${process.env.FRONTEND_URL}/payment-success` || 'https://ecommerce-frontend-deploy-752pmno46.vercel.app/payment-success') + `?transaction_id=${transactionId}`,
      channels: channels,
      metadata: JSON.stringify({ orderId, userId: order.userId }),
      lang: 'fr',

      // Informations client (obligatoires pour carte bancaire)
      customer_id: order.userId.toString(),
      customer_name: customer.name || order.user.lastName || 'Client',
      customer_surname: customer.surname || order.user.firstName || 'Client',
      customer_email: customer.email || order.user.email,
      customer_phone_number: customer.phone || order.user.phone || '+225000000000',
      customer_address: customer.address || 'Adresse non fournie',
      customer_city: customer.city || 'Abidjan',
      customer_country: customer.country || 'CI',
      customer_state: customer.state || 'CI',
      customer_zip_code: customer.zipCode || '00000'
    };

    // Appeler l'API CinetPay
    console.log('📡 Appel API CinetPay avec:', {
      apikey: paymentData.apikey?.substring(0, 10) + '...',
      site_id: paymentData.site_id,
      amount: paymentData.amount,
      transaction_id: paymentData.transaction_id
    });

    const response = await axios.post(CINETPAY_API_URL, paymentData, {
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'EcommerceApp/1.0'
      }
    });

    console.log('📥 Réponse CinetPay:', { code: response.data.code, message: response.data.message });

    if (response.data.code === '201') {
      // Sauvegarder la transaction dans la base de données
      await prisma.payment.create({
        data: {
          orderId: orderId,
          transactionId: transactionId,
          amount: amount,
          currency: currency,
          provider: 'CINETPAY',
          status: 'PENDING',
          paymentUrl: response.data.data.payment_url,
          paymentToken: response.data.data.payment_token,
          metadata: paymentData.metadata
        }
      });

      return res.json({
        success: true,
        message: 'Paiement initialisé avec succès',
        data: {
          payment_url: response.data.data.payment_url,
          payment_token: response.data.data.payment_token,
          transaction_id: transactionId
        }
      });
    } else {
      return res.status(400).json({
        success: false,
        message: 'Erreur lors de l\'initialisation du paiement',
        error: response.data
      });
    }
  } catch (error) {
    console.error('❌ Erreur initialisation paiement CinetPay:', error);
    console.error('❌ Stack:', error.stack);
    console.error('❌ Response:', error.response?.data);

    return res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de l\'initialisation du paiement',
      error: error.response?.data || error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

/**
 * Vérifier le statut d'un paiement
 */
export const checkPaymentStatus = async (req, res) => {
  try {
    const { transactionId } = req.params;

    if (!transactionId) {
      return res.status(400).json({
        success: false,
        message: 'Transaction ID requis'
      });
    }

    // Vérifier dans la base de données
    const payment = await prisma.payment.findUnique({
      where: { transactionId },
      include: { order: true }
    });

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Transaction non trouvée'
      });
    }

    // Vérifier auprès de CinetPay
    const checkData = {
      apikey: process.env.CINETPAY_API_KEY,
      site_id: process.env.CINETPAY_SITE_ID,
      transaction_id: transactionId
    };

    const response = await axios.post(CINETPAY_CHECK_URL, checkData, {
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'EcommerceApp/1.0'
      }
    });

    if (response.data.code === '00') {
      const paymentStatus = response.data.data.status;

      // Mettre à jour le statut dans la base de données
      if (paymentStatus === 'ACCEPTED') {
        await prisma.payment.update({
          where: { transactionId },
          data: { status: 'COMPLETED' }
        });

        await prisma.order.update({
          where: { id: payment.orderId },
          data: {
            paymentStatus: 'PAID',
            status: 'PROCESSING'
          }
        });
      } else if (paymentStatus === 'REFUSED') {
        await prisma.payment.update({
          where: { transactionId },
          data: { status: 'FAILED' }
        });
      }

      return res.json({
        success: true,
        data: {
          transaction_id: transactionId,
          status: paymentStatus,
          amount: response.data.data.amount,
          currency: response.data.data.currency,
          payment_date: response.data.data.payment_date
        }
      });
    } else {
      return res.status(400).json({
        success: false,
        message: 'Erreur lors de la vérification du paiement',
        error: response.data
      });
    }
  } catch (error) {
    console.error('Erreur vérification paiement:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la vérification',
      error: error.response?.data || error.message
    });
  }
};

/**
 * Webhook de notification CinetPay
 */
export const handleNotification = async (req, res) => {
  try {
    const {
      cpm_trans_id,
      cpm_site_id,
      signature,
      cpm_amount,
      cpm_currency,
      cpm_trans_status,
      cpm_custom,
      payment_method,
      cel_phone_num,
      cpm_phone_prefixe,
      cpm_language,
      cpm_version,
      cpm_payment_config,
      cpm_page_action,
      cpm_payment_date,
      cpm_payment_time,
      cpm_error_message
    } = req.body;

    console.log('Notification CinetPay reçue:', req.body);

    // Vérifier la signature pour sécuriser le webhook
    const apikey = process.env.CINETPAY_API_KEY;
    const site_id = process.env.CINETPAY_SITE_ID;

    if (cpm_site_id !== site_id) {
      return res.status(403).json({
        success: false,
        message: 'Site ID invalide'
      });
    }

    // Récupérer la transaction
    const payment = await prisma.payment.findUnique({
      where: { transactionId: cpm_trans_id }
    });

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Transaction non trouvée'
      });
    }

    // Mettre à jour le statut selon la notification
    if (cpm_trans_status === '00' || cpm_trans_status === 'ACCEPTED') {
      // Paiement réussi
      await prisma.payment.update({
        where: { transactionId: cpm_trans_id },
        data: {
          status: 'COMPLETED',
          metadata: JSON.stringify({
            ...JSON.parse(payment.metadata || '{}'),
            payment_method,
            phone: cel_phone_num,
            payment_date: cpm_payment_date,
            payment_time: cpm_payment_time
          })
        }
      });

      await prisma.order.update({
        where: { id: payment.orderId },
        data: {
          paymentStatus: 'PAID',
          status: 'PROCESSING'
        }
      });

      // TODO: Envoyer une notification au client
      console.log(`✅ Paiement réussi pour la commande #${payment.orderId}`);

    } else {
      // Paiement échoué
      await prisma.payment.update({
        where: { transactionId: cpm_trans_id },
        data: {
          status: 'FAILED',
          metadata: JSON.stringify({
            ...JSON.parse(payment.metadata || '{}'),
            error_message: cpm_error_message
          })
        }
      });

      console.log(`❌ Paiement échoué pour la commande #${payment.orderId}`);
    }

    // Répondre à CinetPay
    return res.status(200).json({
      success: true,
      message: 'Notification traitée'
    });

  } catch (error) {
    console.error('Erreur traitement notification CinetPay:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur serveur',
      error: error.message
    });
  }
};

/**
 * Liste des paiements
 */
export const getPayments = async (req, res) => {
  try {
    const userId = req.user.id;
    const { orderId } = req.query;

    let where = {};

    if (orderId) {
      where.orderId = parseInt(orderId);
    }

    // Si pas admin, ne montrer que les paiements de l'utilisateur
    if (req.user.role !== 'ADMIN') {
      where.order = {
        userId: userId
      };
    }

    const payments = await prisma.payment.findMany({
      where,
      include: {
        order: {
          select: {
            id: true,
            userId: true,
            totalAmount: true,
            status: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return res.json({
      success: true,
      data: payments
    });
  } catch (error) {
    console.error('Erreur récupération paiements:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur serveur',
      error: error.message
    });
  }
};
