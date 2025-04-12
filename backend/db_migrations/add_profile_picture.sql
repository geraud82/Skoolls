-- Ajouter la colonne profile_picture à la table users
ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_picture VARCHAR(255);
