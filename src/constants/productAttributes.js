// backend/src/constants/productAttributes.js
export const CATEGORIES = {
  'Électronique': 'Électronique',
  'Vêtements': 'Vêtements',
  'Maison': 'Maison',
  'Beauté': 'Beauté',
  'Sport': 'Sport',
  'Livres': 'Livres',
  'Jouets': 'Jouets',
  'Automobile': 'Automobile',
  'Alimentation': 'Alimentation',
  'Autre': 'Autre'
};

export const CATEGORY_LABELS = {
  'Électronique': 'Électronique',
  'Vêtements': 'Vêtements',
  'Maison': 'Maison & Jardin',
  'Beauté': 'Beauté & Cosmétiques',
  'Sport': 'Sports & Loisirs',
  'Livres': 'Livres & Éducation',
  'Jouets': 'Jouets & Enfants',
  'Automobile': 'Auto & Motos',
  'Alimentation': 'Alimentation',
  'Autre': 'Autre'
};

export const CATEGORY_ATTRIBUTES = {
  'Électronique': {
    required: ['marque', 'modele'],
    optional: ['couleur', 'memoire', 'ecran', 'systeme']
  },
  'Vêtements': {
    required: ['taille', 'couleur', 'genre'],
    optional: ['matiere', 'marque', 'saison']
  },
  'Maison': {
    required: ['type', 'matiere'],
    optional: ['couleur', 'dimensions', 'marque']
  },
  'Beauté': {
    required: ['type', 'marque'],
    optional: ['volume', 'ingredients', 'peau']
  },
  'Sport': {
    required: ['type', 'marque'],
    optional: ['taille', 'couleur', 'materiau']
  },
  'Livres': {
    required: ['auteur', 'editeur'],
    optional: ['isbn', 'langue', 'nombrePages']
  },
  'Jouets': {
    required: ['type', 'marque', 'ageMin'],
    optional: ['couleur', 'materiau', 'nombrePieces']
  },
  'Automobile': {
    required: ['marque', 'modele', 'annee'],
    optional: ['couleur', 'carburant', 'kilometrage']
  },
  'Alimentation': {
    required: ['marque', 'paysOrigin'],
    optional: ['poids', 'ingredients', 'allergenes']
  },
  'Autre': {
    required: [],
    optional: []
  }
};

export function calculateShippingFee(weight, method = 'STANDARD') {
  const baseFee = 5; // Frais de base
  const weightRate = 2; // € par kg

  if (method === 'EXPRESS') {
    return baseFee * 1.5 + (weight * weightRate * 1.2);
  }

  return baseFee + (weight * weightRate);
}