-- Vérifier si la colonne school_id existe déjà dans la table users
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'school_id'
    ) THEN
        -- Ajouter la colonne school_id qui référence l'ID d'une école (un autre utilisateur avec role='ecole')
        ALTER TABLE users ADD COLUMN school_id INTEGER REFERENCES users(id) ON DELETE CASCADE;
        RAISE NOTICE 'Colonne school_id ajoutée à la table users';
    ELSE
        RAISE NOTICE 'La colonne school_id existe déjà dans la table users';
    END IF;
END $$;

-- Vérifier si la colonne permissions existe déjà dans la table users
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'permissions'
    ) THEN
        -- Ajouter la colonne permissions pour stocker les permissions des utilisateurs d'école
        ALTER TABLE users ADD COLUMN permissions JSONB;
        RAISE NOTICE 'Colonne permissions ajoutée à la table users';
    ELSE
        RAISE NOTICE 'La colonne permissions existe déjà dans la table users';
    END IF;
END $$;

-- Créer un index sur school_id pour améliorer les performances des requêtes
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE tablename = 'users' AND indexname = 'idx_users_school_id'
    ) THEN
        CREATE INDEX idx_users_school_id ON users(school_id);
        RAISE NOTICE 'Index idx_users_school_id créé sur la table users';
    ELSE
        RAISE NOTICE 'L''index idx_users_school_id existe déjà sur la table users';
    END IF;
END $$;
