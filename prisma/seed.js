import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Début du seed...');

  // Nettoyer les données existantes
  console.log('🧹 Nettoyage des données existantes...');
  await prisma.review.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.cartItem.deleteMany();
  await prisma.cart.deleteMany();
  await prisma.product.deleteMany();
  await prisma.user.deleteMany();

  // Hasher le mot de passe
  const hashedPassword = await bcrypt.hash('123456', 10);

  // Créer un admin (auto-approuvé)
  console.log('👑 Création de l\'admin...');
  const admin = await prisma.user.create({
    data: {
      email: 'admin@test.com',
      password: hashedPassword,
      firstName: 'Admin',
      lastName: 'System',
      phone: '+2250703333333',
      role: 'ADMIN',
      status: 'APPROVED',
      isVerified: true,
      approvedAt: new Date(),
      approvedBy: null // Self-approved
    },
  });

  await prisma.cart.create({
    data: { userId: admin.id },
  });

  // Créer des vendeurs (en attente d'approbation)
  console.log('👤 Création des vendeurs...');
  const seller1 = await prisma.user.create({
    data: {
      email: 'vendeur@test.com',
      password: hashedPassword,
      firstName: 'Koffi',
      lastName: 'Vendeur',
      phone: '+2250700000000',
      role: 'SELLER',
      status: 'PENDING',
      isVerified: false,
    },
  });

  const seller2 = await prisma.user.create({
    data: {
      email: 'vendeur2@test.com',
      password: hashedPassword,
      firstName: 'Marie',
      lastName: 'Commerce',
      phone: '+2250701111111',
      role: 'SELLER',
      status: 'PENDING',
      isVerified: false,
    },
  });

  await prisma.cart.create({
    data: { userId: seller1.id },
  });

  await prisma.cart.create({
    data: { userId: seller2.id },
  });

  // Créer un acheteur (approuvé)
  console.log('🛒 Création de l\'acheteur...');
  const buyer = await prisma.user.create({
    data: {
      email: 'acheteur@test.com',
      password: hashedPassword,
      firstName: 'Jean',
      lastName: 'Acheteur',
      phone: '+2250702222222',
      role: 'BUYER',
      status: 'APPROVED',
      isVerified: true,
      approvedAt: new Date(),
      approvedBy: admin.id
    },
  });

  await prisma.cart.create({
    data: { userId: buyer.id },
  });

  // Créer des produits avec ATTRIBUTS
  console.log('📦 Création des produits...');
  const products = [
    // ========== PRODUITS À PETITS PRIX (POUR TESTS) ==========
    {
      name: 'Bonbon',
      description: 'Bonbon assort sucré',
      price: 100,
      stock: 1000,
      category: 'FOOD',
      images: ['https://images.unsplash.com/photo-1583396224904-67baf72c2a7c?w=500'],
      attributes: {
        type: 'Bonbon',
        poids: '10g',
      },
      weight: 0.01,
      shippingFee: 0,
      sellerId: seller1.id,
      isActive: true,
    },
    {
      name: 'Stylo Bic',
      description: 'Stylo à bille bleu standard',
      price: 200,
      stock: 500,
      category: 'ACCESSORIES',
      images: ['https://images.unsplash.com/photo-1586075010923-2dd4570fb338?w=500'],
      attributes: {
        color: 'Bleu',
        type: 'Stylo',
      },
      weight: 0.01,
      shippingFee: 0,
      sellerId: seller1.id,
      isActive: true,
    },
    {
      name: 'Gomme',
      description: 'Gomme blanche effaçable',
      price: 100,
      stock: 800,
      category: 'ACCESSORIES',
      images: ['https://images.unsplash.com/photo-1609169847345-5f6c05b5a85f?w=500'],
      attributes: {
        color: 'Blanc',
        type: 'Gomme',
      },
      weight: 0.01,
      shippingFee: 0,
      sellerId: seller1.id,
      isActive: true,
    },
    {
      name: 'Sachet d\'eau',
      description: 'Eau potable en sachet 500ml',
      price: 100,
      stock: 2000,
      category: 'FOOD',
      images: ['https://images.unsplash.com/photo-1548839140-29a749e1cf4d?w=500'],
      attributes: {
        capacity: '500ml',
        type: 'Eau',
      },
      weight: 0.5,
      shippingFee: 0,
      sellerId: seller1.id,
      isActive: true,
    },
    {
      name: 'Pain',
      description: 'Pain frais du jour',
      price: 500,
      stock: 100,
      category: 'FOOD',
      images: ['https://images.unsplash.com/photo-1509440159596-0249088772ff?w=500'],
      attributes: {
        type: 'Pain',
        poids: '250g',
      },
      weight: 0.25,
      shippingFee: 0,
      sellerId: seller1.id,
      isActive: true,
    },
    {
      name: 'Cahier 48 pages',
      description: 'Cahier petit format 48 pages',
      price: 500,
      stock: 300,
      category: 'ACCESSORIES',
      images: ['https://images.unsplash.com/photo-1517842645767-c639042777db?w=500'],
      attributes: {
        pages: '48',
        format: 'Petit',
        type: 'Cahier',
      },
      weight: 0.1,
      shippingFee: 0,
      sellerId: seller1.id,
      isActive: true,
    },
    {
      name: 'Crayon HB',
      description: 'Crayon à papier HB',
      price: 200,
      stock: 600,
      category: 'ACCESSORIES',
      images: ['https://images.unsplash.com/photo-1516214104703-d870798883c5?w=500'],
      attributes: {
        type: 'Crayon',
        grade: 'HB',
      },
      weight: 0.01,
      shippingFee: 0,
      sellerId: seller2.id,
      isActive: true,
    },
    {
      name: 'Cacahuète grillée (sachet)',
      description: 'Sachet de cacahuètes grillées 50g',
      price: 200,
      stock: 500,
      category: 'FOOD',
      images: ['https://images.unsplash.com/photo-1608797178974-15b35a64ede9?w=500'],
      attributes: {
        type: 'Snack',
        poids: '50g',
      },
      weight: 0.05,
      shippingFee: 0,
      sellerId: seller2.id,
      isActive: true,
    },
    {
      name: 'Sucette',
      description: 'Sucette colorée goût fruits',
      price: 100,
      stock: 1500,
      category: 'FOOD',
      images: ['https://images.unsplash.com/photo-1581798459219-7c0a0f55b2f8?w=500'],
      attributes: {
        type: 'Bonbon',
        goût: 'Fruits',
      },
      weight: 0.01,
      shippingFee: 0,
      sellerId: seller2.id,
      isActive: true,
    },
    {
      name: 'Allumette (boîte)',
      description: 'Boîte d\'allumettes',
      price: 100,
      stock: 800,
      category: 'ACCESSORIES',
      images: ['https://images.unsplash.com/photo-1606074984397-4f70b1c9e682?w=500'],
      attributes: {
        type: 'Allumettes',
        quantité: '40 bâtons',
      },
      weight: 0.02,
      shippingFee: 0,
      sellerId: seller2.id,
      isActive: true,
    },

    // ========== PRODUITS NORMAUX ==========
    // VÊTEMENTS
    {
      name: 'T-shirt Nike Sport',
      description: 'T-shirt de sport confortable et respirant',
      price: 15000,
      stock: 50,
      category: 'CLOTHING',
      images: ['https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=500'],
      attributes: {
        color: 'Noir',
        size: 'L',
        material: 'Coton',
        pattern: 'Uni',
      },
      weight: 0.3,
      dimensions: { length: 30, width: 25, height: 2 },
      shippingFee: 1000,
      sellerId: seller1.id,
      isActive: true,
    },
    {
      name: 'Jean Levi\'s 501',
      description: 'Jean classique coupe droite',
      price: 35000,
      stock: 40,
      category: 'CLOTHING',
      images: ['https://images.unsplash.com/photo-1542272604-787c3835535d?w=500'],
      attributes: {
        color: 'Bleu',
        size: 'M',
        material: 'Jean',
        pattern: 'Uni',
      },
      weight: 0.6,
      shippingFee: 1000,
      sellerId: seller1.id,
      isActive: true,
    },

    // CHAUSSURES
    {
      name: 'Sneakers Adidas Original',
      description: 'Chaussures de sport légères et confortables',
      price: 45000,
      stock: 30,
      category: 'SHOES',
      images: ['https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500'],
      attributes: {
        color: 'Blanc',
        size: '42',
        material: 'Cuir synthétique',
        type: 'Sneakers',
      },
      weight: 0.8,
      shippingFee: 1000,
      sellerId: seller1.id,
      isActive: true,
    },
    {
      name: 'Baskets Nike Air Max',
      description: 'Baskets avec technologie Air visible',
      price: 65000,
      stock: 25,
      category: 'SHOES',
      images: ['https://images.unsplash.com/photo-1549298916-b41d501d3772?w=500'],
      attributes: {
        color: 'Noir',
        size: '41',
        material: 'Cuir',
        type: 'Baskets',
      },
      weight: 0.9,
      shippingFee: 1000,
      sellerId: seller2.id,
      isActive: true,
    },

    // SACS
    {
      name: 'Sac à dos Eastpak',
      description: 'Sac à dos spacieux avec plusieurs compartiments',
      price: 25000,
      stock: 20,
      category: 'BAGS',
      images: ['https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=500'],
      attributes: {
        color: 'Noir',
        format: 'Grand',
        type: 'Sac à dos',
        material: 'Nylon',
      },
      weight: 0.5,
      shippingFee: 1000,
      sellerId: seller2.id,
      isActive: true,
    },
    {
      name: 'Sac à main Cuir',
      description: 'Élégant sac à main en cuir véritable',
      price: 45000,
      stock: 15,
      category: 'BAGS',
      images: ['https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=500'],
      attributes: {
        color: 'Marron',
        format: 'Moyen',
        type: 'Sac à main',
        material: 'Cuir',
      },
      weight: 0.7,
      shippingFee: 1000,
      sellerId: seller2.id,
      isActive: true,
    },

    // CONTENANTS
    {
      name: 'Bouteille Sport 1L',
      description: 'Bouteille réutilisable sans BPA',
      price: 3500,
      stock: 100,
      category: 'CONTAINERS',
      images: ['https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=500'],
      attributes: {
        color: 'Bleu',
        format: 'Moyen',
        capacity: '1L',
        material: 'Plastique',
      },
      weight: 0.2,
      shippingFee: 1000,
      sellerId: seller1.id,
      isActive: true,
    },
    {
      name: 'Boîte Hermétique 2L',
      description: 'Boîte de conservation alimentaire',
      price: 5000,
      stock: 80,
      category: 'CONTAINERS',
      images: ['https://images.unsplash.com/photo-1610557892470-55d9e80c0bce?w=500'],
      attributes: {
        color: 'Transparent',
        format: 'Grand',
        capacity: '2L',
        material: 'Plastique',
      },
      weight: 0.3,
      shippingFee: 1000,
      sellerId: seller1.id,
      isActive: true,
    },

    // ACCESSOIRES
    {
      name: 'Montre Casio G-Shock',
      description: 'Montre digitale résistante aux chocs',
      price: 55000,
      stock: 15,
      category: 'ACCESSORIES',
      images: ['https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500'],
      attributes: {
        color: 'Noir',
        type: 'Montre',
        material: 'Plastique',
      },
      weight: 0.15,
      shippingFee: 1000,
      sellerId: seller2.id,
      isActive: true,
    },
    {
      name: 'Lunettes de Soleil Ray-Ban',
      description: 'Lunettes de soleil classiques',
      price: 35000,
      stock: 25,
      category: 'ACCESSORIES',
      images: ['https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=500'],
      attributes: {
        color: 'Noir',
        type: 'Lunettes',
        material: 'Plastique',
      },
      weight: 0.1,
      shippingFee: 1000,
      sellerId: seller2.id,
      isActive: true,
    },
  ];

  const createdProducts = [];
  for (const product of products) {
    const created = await prisma.product.create({ data: product });
    createdProducts.push(created);
    console.log(`✅ ${created.name}`);
  }

  // Créer des avis
  console.log('\n⭐ Création des avis...');
  await prisma.review.create({
    data: {
      productId: createdProducts[0].id,
      userId: buyer.id,
      rating: 5,
      comment: 'Excellent produit ! Très satisfait.',
    },
  });

  await prisma.review.create({
    data: {
      productId: createdProducts[2].id,
      userId: buyer.id,
      rating: 4,
      comment: 'Très confortable, je recommande.',
    },
  });

  console.log('\n✅ Seed terminé avec succès!\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📧 COMPTES DE TEST:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('\n👑 ADMIN: admin@test.com / 123456 (Approuvé)');
  console.log('👨‍💼 VENDEUR 1: vendeur@test.com / 123456 (En attente)');
  console.log('👩‍💼 VENDEUR 2: vendeur2@test.com / 123456 (En attente)');
  console.log('🛒 ACHETEUR: acheteur@test.com / 123456 (Approuvé)');
  console.log(`\n📦 ${products.length} PRODUITS CRÉÉS`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

main()
  .catch((e) => {
    console.error('❌ Erreur:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });