-- Ajout des champs pour les détails de paiement à la table classes

-- Vérifier si la colonne registration_fee existe déjà
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'classes' AND column_name = 'registration_fee'
    ) THEN
        ALTER TABLE classes ADD COLUMN registration_fee DECIMAL DEFAULT 0;
    END IF;
END $$;

-- Vérifier si la colonne payment_installments existe déjà
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'classes' AND column_name = 'payment_installments'
    ) THEN
        ALTER TABLE classes ADD COLUMN payment_installments JSONB DEFAULT '[]'::jsonb;
    END IF;
END $$;

-- Vérifier si la colonne payment_deadlines existe déjà
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'classes' AND column_name = 'payment_deadlines'
    ) THEN
        ALTER TABLE classes ADD COLUMN payment_deadlines JSONB DEFAULT '[]'::jsonb;
    END IF;
END $$;

-- Commentaire sur l'utilisation:
-- payment_installments stockera un tableau JSON de tranches de paiement
-- Exemple: [{"name": "Première tranche", "amount": 50000}, {"name": "Deuxième tranche", "amount": 50000}]
-- 
-- payment_deadlines stockera un tableau JSON de dates limites correspondant aux tranches
-- Exemple: [{"installment_index": 0, "deadline": "2023-10-31"}, {"installment_index": 1, "deadline": "2024-01-31"}]
