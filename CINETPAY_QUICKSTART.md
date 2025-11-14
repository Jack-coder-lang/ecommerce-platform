# 🚀 CinetPay - Guide de démarrage rapide

## ✅ Ce qui a été installé

### 1. Fichiers créés
- ✅ `src/controllers/payment.controller.js` - Controller complet CinetPay
- ✅ `src/routes/payment.routes.js` - Routes de paiement
- ✅ `prisma/schema.prisma` - Modèle Payment ajouté
- ✅ `CINETPAY_INTEGRATION_GUIDE.md` - Documentation complète
- ✅ `CINETPAY_QUICKSTART.md` - Ce guide

### 2. Modifications
- ✅ `src/app.js` - Routes payment ajoutées
- ✅ Client Prisma généré avec le nouveau modèle Payment

## 🔧 Configuration nécessaire

### 1. Vérifiez votre fichier `.env`

```env
# CinetPay Configuration
CINETPAY_API_KEY=2790451905b8f0922851de5.61641716
CINETPAY_SITE_ID=823091  
CINETPAY_SECRET_KEY=13326597045c065b0839a5c9.65364522
CINETPAY_NOTIFY_URL=https://votre-backend.vercel.app/api/payments/cinetpay/notify
```

**⚠️ IMPORTANT:** Remplacez les valeurs par vos vraies clés CinetPay!

### 2. Créez la migration Prisma

```bash
# Créer et appliquer la migration
npx prisma migrate dev --name add_payment_model

# Ou si en production
npx prisma db push
```

### 3. Testez votre installation

```bash
# Démarrez le serveur
npm run dev

# Le serveur devrait démarrer sans erreur
```

## 📡 Endpoints disponibles

### 1. Initialiser un paiement
```http
POST /api/payments/cinetpay/initialize
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json

{
  "orderId": 123,
  "amount": 10000,
  "currency": "XOF",
  "channels": "ALL",
  "customer": {
    "name": "KOUADIO",
    "surname": "Francisse",
    "email": "client@example.com",
    "phone": "+225000000000",
    "address": "Abidjan",
    "city": "Abidjan",
    "country": "CI",
    "state": "CI",
    "zipCode": "00225"
  }
}
```

### 2. Vérifier un paiement
```http
GET /api/payments/cinetpay/check/TXN1699999999123
Authorization: Bearer YOUR_JWT_TOKEN
```

### 3. Webhook (appelé automatiquement par CinetPay)
```http
POST /api/payments/cinetpay/notify
Content-Type: application/json

{
  "cpm_trans_id": "TXN1699999999123",
  "cpm_site_id": "votre_site_id",
  "cpm_trans_status": "00",
  ...
}
```

### 4. Liste des paiements
```http
GET /api/payments
Authorization: Bearer YOUR_JWT_TOKEN
```

## 🧪 Comment tester

### Option 1: Avec Postman/Insomnia

1. Créez une commande dans votre système
2. Utilisez l'endpoint `/api/payments/cinetpay/initialize`
3. Récupérez le `payment_url` de la réponse
4. Ouvrez le `payment_url` dans un navigateur
5. Effectuez le paiement test

### Option 2: Test local avec ngrok

```bash
# 1. Installez ngrok
npm install -g ngrok

# 2. Démarrez votre serveur local
npm run dev

# 3. Créez un tunnel ngrok
ngrok http 5000

# 4. Mettez à jour votre .env avec l'URL ngrok
CINETPAY_NOTIFY_URL=https://votre-tunnel.ngrok.io/api/payments/cinetpay/notify
```

## 📱 Intégration Frontend

### Exemple avec React/Axios

```javascript
import axios from 'axios';

// Fonction pour initier le paiement
const handlePayment = async () => {
  try {
    const response = await axios.post(
      'https://votre-backend.com/api/payments/cinetpay/initialize',
      {
        orderId: order.id,
        amount: order.total,
        currency: 'XOF',
        channels: 'ALL',
        customer: {
          name: user.lastName,
          surname: user.firstName,
          email: user.email,
          phone: user.phone || '+225000000000',
          address: shippingAddress.address || 'Adresse',
          city: shippingAddress.city || 'Abidjan',
          country: 'CI',
          state: 'CI',
          zipCode: '00225'
        }
      },
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );

    if (response.data.success) {
      // Rediriger vers la page de paiement CinetPay
      window.location.href = response.data.data.payment_url;
    }
  } catch (error) {
    console.error('Erreur initialisation paiement:', error);
    alert('Erreur lors de l\'initialisation du paiement');
  }
};

// Sur la page de retour
const checkPaymentStatus = async (transactionId) => {
  try {
    const response = await axios.get(
      `https://votre-backend.com/api/payments/cinetpay/check/${transactionId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );

    if (response.data.data.status === 'ACCEPTED') {
      // Paiement réussi
      navigate('/orders/success');
    } else {
      // Paiement échoué
      navigate('/orders/failed');
    }
  } catch (error) {
    console.error('Erreur vérification:', error);
  }
};
```

## 🔒 Sécurité

Le système vérifie automatiquement:
- ✅ Token HMAC dans les webhooks
- ✅ Site ID correspondant
- ✅ Authentification JWT pour les endpoints protégés
- ✅ User-Agent requis par CinetPay

## ⚠️ Points importants

1. **Montants**: Doivent être des multiples de 5 (XOF, XAF, etc.)
2. **Devise**: Doit correspondre à celle de votre compte CinetPay
3. **Transaction ID**: Généré automatiquement, toujours unique
4. **Notify URL**: Ne peut PAS être localhost en production
5. **Test**: Utilisez ngrok pour tester localement

## 🐛 Dépannage rapide

### Le paiement ne s'initialise pas
- Vérifiez vos clés API dans `.env`
- Vérifiez que le montant est un multiple de 5
- Vérifiez que la devise correspond à votre compte

### Le webhook ne fonctionne pas
- Vérifiez que CINETPAY_NOTIFY_URL est correct
- Vérifiez que l'URL est publique (pas localhost)
- Vérifiez les logs serveur pour voir les notifications

### Erreur 1010
- Le système envoie déjà le User-Agent automatiquement
- Si l'erreur persiste, contactez le support CinetPay

## 📚 Documentation complète

Pour plus de détails, consultez `CINETPAY_INTEGRATION_GUIDE.md`

## 🆘 Support

- Documentation CinetPay: https://docs.cinetpay.com
- Support technique: support.technique@cinetpay.com

---

**Prêt à tester?** 🚀

1. Configurez votre `.env`
2. Lancez `npx prisma db push`
3. Démarrez votre serveur
4. Testez avec Postman ou depuis votre frontend!
