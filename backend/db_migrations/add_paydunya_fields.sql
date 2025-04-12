-- Ajouter des champs pour PayDunya à la table payments
ALTER TABLE payments ADD COLUMN IF NOT EXISTS payment_token VARCHAR(255);
ALTER TABLE payments ADD COLUMN IF NOT EXISTS payment_url VARCHAR(255);
ALTER TABLE payments ADD COLUMN IF NOT EXISTS payment_status VARCHAR(50) DEFAULT 'pending';
ALTER TABLE payments ADD COLUMN IF NOT EXISTS payment_details JSONB;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS transaction_id VARCHAR(255);
