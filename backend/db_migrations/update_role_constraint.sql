-- Supprimer la contrainte existante
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;

-- Ajouter une nouvelle contrainte avec les rôles supplémentaires
ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (
  role::text = ANY (ARRAY[
    'parent'::character varying,
    'ecole'::character varying,
    'admin'::character varying,
    'censeur'::character varying,
    'comptable'::character varying,
    'surveillant'::character varying,
    'bibliothecaire'::character varying
  ]::text[])
);
