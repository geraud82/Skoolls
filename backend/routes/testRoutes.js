const express = require('express');
const router = express.Router();
const db = require('../config/db');

// Route pour créer une classe de test avec un ID spécifique
router.post('/create-test-class', async (req, res) => {
  try {
    const { id, school_id, name, tuition_fee } = req.body;
    
    // Vérifier si la classe existe déjà
    const existingClass = await db.query('SELECT * FROM classes WHERE id = $1', [id]);
    if (existingClass.rows.length > 0) {
      return res.status(400).json({ 
        message: 'Une classe avec cet ID existe déjà', 
        class: existingClass.rows[0] 
      });
    }
    
    // Créer la classe avec l'ID spécifié
    const result = await db.query(
      'INSERT INTO classes (id, school_id, name, tuition_fee) VALUES ($1, $2, $3, $4) RETURNING *',
      [id, school_id, name || 'Classe de test', tuition_fee || 100]
    );
    
    res.status(201).json({
      message: 'Classe de test créée avec succès',
      class: result.rows[0]
    });
  } catch (error) {
    console.error('Erreur lors de la création de la classe de test:', error);
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

// Route pour lister toutes les tables de la base de données
router.get('/db-tables', async (req, res) => {
  try {
    const result = await db.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    
    res.json({
      message: 'Tables de la base de données',
      tables: result.rows.map(row => row.table_name)
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des tables:', error);
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

// Route pour afficher la structure d'une table
router.get('/table-structure/:table', async (req, res) => {
  try {
    const { table } = req.params;
    const result = await db.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = $1
    `, [table]);
    
    res.json({
      message: `Structure de la table ${table}`,
      columns: result.rows
    });
  } catch (error) {
    console.error('Erreur lors de la récupération de la structure de la table:', error);
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

module.exports = router;
