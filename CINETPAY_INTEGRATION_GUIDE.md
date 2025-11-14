# Guide d'intégration CinetPay

## 📋 Table des matières
1. [Configuration](#configuration)
2. [Initialisation d'un paiement](#initialisation)
3. [Vérification du statut](#verification)
4. [Webhook de notification](#webhook)
5. [Tests](#tests)

## 🔧 Configuration

### 1. Variables d'environnement (.env)

```env
# CinetPay Configuration
CINETPAY_API_KEY=votre_api_key
CINETPAY_SITE_ID=votre_site_id
CINETPAY_SECRET_KEY=votre_secret_key
CINETPAY_NOTIFY_URL=https://votre-domaine.com/api/payments/cinetpay/notify

# URLs
BACKEND_URL=https://votre-backend.com
FRONTEND_URL=https://votre-frontend.com
```

### 2. Créer le modèle Payment dans Prisma

Ajoutez ce modèle dans `prisma/schema.prisma` :

```prisma
model Payment {
  id              String        @id @default(uuid())
  orderId         String
  transactionId   String        @unique
  amount          Float
  currency        String        @default("XOF")
  provider        String        @default("CINETPAY")
  status          String        @default("PENDING") // PENDING, COMPLETED, FAILED
  paymentUrl      String?
  paymentToken    String?
  paymentMethod   String?
  metadata        String?
  
  createdAt       DateTime      @default(now())
  updatedAt       DateTime      @updatedAt

  @@index([orderId])
  @@index([transactionId])
  @@index([status])
}
```

Puis exécutez :
```bash
npx prisma migrate dev --name add_payment_model
npx prisma generate
```

## 🚀 Utilisation

### 1. Initialiser un paiement

**Endpoint:** `POST /api/payments/cinetpay/initialize`

**Headers:**
```json
{
  "Authorization": "Bearer YOUR_JWT_TOKEN",
  "Content-Type": "application/json"
}
```

**Body:**
```json
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
    "address": "Abidjan Cocody",
    "city": "Abidjan",
    "country": "CI",
    "state": "CI",
    "zipCode": "00225"
  }
}
```

**Réponse succès:**
```json
{
  "success": true,
  "message": "Paiement initialisé avec succès",
  "data": {
    "payment_url": "https://checkout.cinetpay.com/payment/TOKEN",
    "payment_token": "TOKEN",
    "transaction_id": "TXN1699999999123"
  }
}
```

### 2. Rediriger l'utilisateur

Redirigez l'utilisateur vers `payment_url` pour qu'il effectue le paiement.

### 3. Vérifier le statut

**Endpoint:** `GET /api/payments/cinetpay/check/:transactionId`

**Exemple:**
```bash
GET /api/payments/cinetpay/check/TXN1699999999123
Authorization: Bearer YOUR_JWT_TOKEN
```

**Réponse:**
```json
{
  "success": true,
  "data": {
    "transaction_id": "TXN1699999999123",
    "status": "ACCEPTED",
    "amount": "10000",
    "currency": "XOF",
    "payment_date": "2024-01-15 14:30:00"
  }
}
```

## 🔔 Webhook de notification

CinetPay enverra une notification POST à votre `notify_url` :

**URL:** `POST /api/payments/cinetpay/notify`

**Paramètres reçus:**
- `cpm_trans_id` : ID de transaction
- `cpm_site_id` : Votre site ID
- `cpm_amount` : Montant
- `cpm_trans_status` : Statut (00 = ACCEPTED)
- `signature` : Token de sécurité
- `payment_method` : Méthode de paiement
- Et autres...

**Headers:**
- `x-token` : Token HMAC pour vérification

Le système vérifie automatiquement le token HMAC et met à jour la base de données.

## 🧪 Tests

### Test en local

Pour tester localement, utilisez **ngrok** ou **localtunnel** :

```bash
# Avec ngrok
ngrok http 5000

# Votre notify_url sera:
# https://votre-tunnel.ngrok.io/api/payments/cinetpay/notify
```

⚠️ **Important:** CinetPay n'accepte pas `localhost` pour notify_url et return_url.

### Données de test

Utilisez vos vraies clés API. Les sandbox ne sont pas disponibles.

**Montants de test:**
- Minimum : 100 XOF
- Maximum : 1 500 000 XOF
- Doit être un multiple de 5

**Pays de test:**
- Côte d'Ivoire : `CI`
- Sénégal : `SN`
- Cameroun : `CM`
- Etc.

## 📊 Statuts de paiement

| Code | Status | Description |
|------|--------|-------------|
| 00 | ACCEPTED | Paiement réussi |
| 201 | CREATED | Transaction initialisée |
| 600 | PAYMENT_FAILED | Paiement échoué |
| 602 | INSUFFICIENT_BALANCE | Solde insuffisant |
| 623 | WAITING | En attente de confirmation |
| 627 | CANCELLED | Transaction annulée |

## 🛠️ Exemple d'intégration frontend

### React avec Axios

```javascript
// Initialiser le paiement
const initiatePayment = async (orderId, amount, customer) => {
  try {
    const response = await axios.post(
      '/api/payments/cinetpay/initialize',
      {
        orderId,
        amount,
        currency: 'XOF',
        channels: 'ALL',
        customer
      },
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );

    // Rediriger vers la page de paiement
    window.location.href = response.data.data.payment_url;
  } catch (error) {
    console.error('Erreur initialisation paiement:', error);
  }
};

// Vérifier le statut après retour
const checkPaymentStatus = async (transactionId) => {
  try {
    const response = await axios.get(
      `/api/payments/cinetpay/check/${transactionId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );

    if (response.data.data.status === 'ACCEPTED') {
      console.log('Paiement réussi!');
    }
  } catch (error) {
    console.error('Erreur vérification:', error);
  }
};
```

## ⚠️ Points importants

1. **Transaction ID unique** : Généré automatiquement par le backend
2. **Montant** : Doit être un multiple de 5 (sauf USD)
3. **Devise** : Doit correspondre à celle de votre compte CinetPay
4. **notify_url** : Ne pas utiliser localhost en production
5. **Sécurité** : Le webhook vérifie automatiquement le token HMAC
6. **User-Agent** : Toujours envoyé dans les requêtes (requis par CinetPay)

## 🐛 Dépannage

### Erreur 608 - Paramètres manquants
- Vérifiez que tous les paramètres obligatoires sont envoyés
- Vérifiez le format JSON

### Erreur 609 - Apikey incorrect
- Vérifiez votre CINETPAY_API_KEY dans .env

### Erreur 613 - Site ID invalide
- Vérifiez votre CINETPAY_SITE_ID dans .env

### Erreur 1010 - User-Agent manquant
- Le controller envoie automatiquement le User-Agent

### Page 400 - Accès interdit (localhost)
- Utilisez ngrok ou localtunnel pour tester
- En production, utilisez votre domaine réel

## 📞 Support

- Documentation officielle: https://docs.cinetpay.com
- Support technique: support.technique@cinetpay.com
