import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import pool from './database.js'; // ← ton fichier database.js

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW()');
    res.json({ message: 'Backend en ligne !', dbTime: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur base de données' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
