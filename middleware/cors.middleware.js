// backend/src/middleware/cors.middleware.js
import cors from 'cors';

const whitelist = process.env.FRONTEND_URL.split(',');

const corsOptions = {
  origin: function (origin, callback) {
    // Autorise les requêtes sans origin (Postman, mobile, etc.)
    if (!origin) return callback(null, true);
    
    if (whitelist.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.log('CORS bloqué pour :', origin);
      callback(new Error('CORS non autorisé'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

export default cors(corsOptions);