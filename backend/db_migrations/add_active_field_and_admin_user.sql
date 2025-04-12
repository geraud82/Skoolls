-- Ajouter le champ active à la table users s'il n'existe pas déjà
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'users' AND column_name = 'active') THEN
        ALTER TABLE users ADD COLUMN active BOOLEAN DEFAULT TRUE;
    END IF;
END $$;

-- Mettre à jour tous les utilisateurs existants pour les définir comme actifs
UPDATE users SET active = TRUE WHERE active IS NULL;

-- Vérifier si un utilisateur admin existe déjà
DO $$
DECLARE
    admin_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO admin_count FROM users WHERE role = 'admin';
    
    IF admin_count = 0 THEN
        -- Créer un utilisateur administrateur si aucun n'existe
        -- Ajouter une valeur 'admin' à la contrainte de vérification de la colonne role
        ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
        ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN ('parent', 'ecole', 'admin'));
        
        -- Insérer l'utilisateur administrateur
        INSERT INTO users (name, email, password, role, active)
        VALUES (
            'Administrateur',
            'admin@schoolpay.com',
            -- Mot de passe haché pour 'admin123' (à changer en production)
            '$2b$10$X7o4.KTbCOPYnOXj3DXkK.3NkSOqQf4Vl0vVZYwqPoPb9kGp2Qpou',
            'admin',
            TRUE
        );
        
        RAISE NOTICE 'Utilisateur administrateur créé avec succès';
        RAISE NOTICE 'Email: admin@schoolpay.com';
        RAISE NOTICE 'Mot de passe: admin123';
    ELSE
        RAISE NOTICE 'Un utilisateur administrateur existe déjà';
    END IF;
END $$;
