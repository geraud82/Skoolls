const db = require('../config/db');

// Récupérer toutes les notifications d'un utilisateur
const getUserNotifications = async (req, res) => {
  const userId = req.user.id;

  try {
    const result = await db.query(
      'SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC',
      [userId]
    );

    res.status(200).json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};

// Marquer une notification comme lue
const markAsRead = async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  try {
    // Vérifier que la notification appartient à l'utilisateur
    const notificationCheck = await db.query(
      'SELECT * FROM notifications WHERE id = $1 AND user_id = $2',
      [id, userId]
    );

    if (notificationCheck.rows.length === 0) {
      return res.status(404).json({ message: 'Notification introuvable.' });
    }

    // Mettre à jour le statut de la notification
    await db.query(
      'UPDATE notifications SET is_read = true WHERE id = $1',
      [id]
    );

    res.status(200).json({ message: 'Notification marquée comme lue.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};

// Marquer toutes les notifications d'un utilisateur comme lues
const markAllAsRead = async (req, res) => {
  const userId = req.user.id;

  try {
    await db.query(
      'UPDATE notifications SET is_read = true WHERE user_id = $1',
      [userId]
    );

    res.status(200).json({ message: 'Toutes les notifications marquées comme lues.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};

// Supprimer une notification
const deleteNotification = async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  try {
    // Vérifier que la notification appartient à l'utilisateur
    const notificationCheck = await db.query(
      'SELECT * FROM notifications WHERE id = $1 AND user_id = $2',
      [id, userId]
    );

    if (notificationCheck.rows.length === 0) {
      return res.status(404).json({ message: 'Notification introuvable.' });
    }

    // Supprimer la notification
    await db.query(
      'DELETE FROM notifications WHERE id = $1',
      [id]
    );

    res.status(200).json({ message: 'Notification supprimée.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};

module.exports = {
  getUserNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification
};
