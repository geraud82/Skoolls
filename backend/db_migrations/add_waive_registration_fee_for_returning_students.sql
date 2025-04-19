-- Ajouter le champ waive_registration_fee_for_returning_students à la table classes
ALTER TABLE classes ADD COLUMN IF NOT EXISTS waive_registration_fee_for_returning_students BOOLEAN DEFAULT false;
