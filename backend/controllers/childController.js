const { addChild, getChildrenByParent } = require('../models/childModel');
const db = require('../config/db');

const createChild = async (req, res) => {
  const { first_name, last_name, birth_date } = req.body;
  const user_id = req.user.id;
  try {
    const child = await addChild({ user_id, first_name, last_name, birth_date });
    res.status(201).json(child);
  } catch (err) {
    console.error('Erreur détaillée lors de l\'ajout de l\'enfant:', err);
    console.error('Stack trace:', err.stack);
    res.status(500).json({ message: 'Erreur lors de l\'ajout de l\'enfant', error: err.message });
  }
};

const listChildren = async (req, res) => {
  const user_id = req.user.id;
  try {
    const children = await getChildrenByParent(user_id);
    res.json(children);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur lors de la récupération des enfants' });
  }
};

const updateChild = async (req, res) => {
  const { id } = req.params;
  const { first_name, last_name, birth_date, gender } = req.body;
  const user_id = req.user.id;

  try {
    // Vérifier si l'enfant existe et appartient à l'utilisateur
    const checkResult = await db.query('SELECT * FROM children WHERE id = $1 AND user_id = $2', [id, user_id]);
    
    if (checkResult.rowCount === 0) {
      return res.status(404).json({ message: "Enfant non trouvé ou non autorisé" });
    }

    // Mettre à jour les informations de l'enfant
    const result = await db.query(
      'UPDATE children SET first_name = $1, last_name = $2, birth_date = $3, gender = $4, updated_at = CURRENT_TIMESTAMP WHERE id = $5 AND user_id = $6 RETURNING *',
      [first_name, last_name, birth_date, gender, id, user_id]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erreur lors de la mise à jour" });
  }
};

const deleteChild = async (req, res) => {
  const { id } = req.params;
  const user_id = req.user.id;

  try {
    const result = await db.query('DELETE FROM children WHERE id = $1 AND user_id = $2 RETURNING *', [id, user_id]);

    if (result.rowCount === 0) {
      return res.status(404).json({ message: "Enfant non trouvé ou non autorisé" });
    }

    res.json({ message: "Enfant supprimé avec succès" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erreur lors de la suppression" });
  }
};


module.exports = {
  createChild,
  listChildren,
  updateChild,
  deleteChild,
};
