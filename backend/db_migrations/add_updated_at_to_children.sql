-- Ajouter la colonne updated_at à la table children
ALTER TABLE children ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- Mettre à jour la colonne updated_at pour les enregistrements existants
UPDATE children SET updated_at = created_at WHERE updated_at IS NULL;
