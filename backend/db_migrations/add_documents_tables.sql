-- Table pour les factures
CREATE TABLE IF NOT EXISTS invoices (
  id SERIAL PRIMARY KEY,
  enrollment_id INTEGER NOT NULL REFERENCES enrollments(id),
  invoice_number VARCHAR(20) NOT NULL UNIQUE,
  amount DECIMAL(10, 2) NOT NULL,
  status VARCHAR(20) NOT NULL,
  parent_id INTEGER NOT NULL REFERENCES users(id),
  school_id INTEGER NOT NULL REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table pour les reçus
CREATE TABLE IF NOT EXISTS receipts (
  id SERIAL PRIMARY KEY,
  payment_id INTEGER NOT NULL REFERENCES payments(id),
  receipt_number VARCHAR(20) NOT NULL UNIQUE,
  amount DECIMAL(10, 2) NOT NULL,
  payment_method VARCHAR(50) NOT NULL,
  payment_date TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Trigger pour mettre à jour le champ updated_at des factures
CREATE OR REPLACE FUNCTION update_invoices_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger 
        WHERE tgname = 'trigger_update_invoices_updated_at'
    ) THEN
        CREATE TRIGGER trigger_update_invoices_updated_at
        BEFORE UPDATE ON invoices
        FOR EACH ROW
        EXECUTE FUNCTION update_invoices_updated_at();
    END IF;
END $$;

-- Trigger pour mettre à jour le champ updated_at des reçus
CREATE OR REPLACE FUNCTION update_receipts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger 
        WHERE tgname = 'trigger_update_receipts_updated_at'
    ) THEN
        CREATE TRIGGER trigger_update_receipts_updated_at
        BEFORE UPDATE ON receipts
        FOR EACH ROW
        EXECUTE FUNCTION update_receipts_updated_at();
    END IF;
END $$;

-- Trigger pour générer automatiquement un reçu après un paiement
CREATE OR REPLACE FUNCTION generate_receipt_after_payment()
RETURNS TRIGGER AS $$
DECLARE
  receipt_number VARCHAR(20);
  year VARCHAR(2);
  month VARCHAR(2);
  sequence INTEGER;
  last_number VARCHAR(20);
BEGIN
  -- Vérifier si un reçu existe déjà pour ce paiement
  IF EXISTS (SELECT 1 FROM receipts WHERE payment_id = NEW.id) THEN
    RETURN NEW;
  END IF;
  
  -- Générer un numéro de reçu unique
  year := to_char(CURRENT_DATE, 'YY');
  month := to_char(CURRENT_DATE, 'MM');
  
  -- Récupérer le dernier numéro de reçu pour ce mois
  SELECT MAX(receipt_number) INTO last_number
  FROM receipts
  WHERE receipt_number LIKE 'REC-' || year || month || '-%';
  
  IF last_number IS NULL THEN
    sequence := 1;
  ELSE
    sequence := to_number(substring(last_number from 9), '9999') + 1;
  END IF;
  
  receipt_number := 'REC-' || year || month || '-' || lpad(sequence::text, 4, '0');
  
  -- Créer le reçu
  INSERT INTO receipts (
    payment_id,
    receipt_number,
    amount,
    payment_method,
    payment_date
  ) VALUES (
    NEW.id,
    receipt_number,
    NEW.amount,
    NEW.method,
    NEW.created_at
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger 
        WHERE tgname = 'trigger_generate_receipt_after_payment'
    ) THEN
        CREATE TRIGGER trigger_generate_receipt_after_payment
        AFTER INSERT ON payments
        FOR EACH ROW
        EXECUTE FUNCTION generate_receipt_after_payment();
    END IF;
END $$;

-- Trigger pour mettre à jour le statut de la facture après un paiement
CREATE OR REPLACE FUNCTION update_invoice_status_after_payment()
RETURNS TRIGGER AS $$
DECLARE
  enrollment_id INTEGER;
  invoice_id INTEGER;
BEGIN
  -- Récupérer l'ID de l'inscription associée au paiement
  SELECT e.id INTO enrollment_id
  FROM enrollments e
  WHERE e.id = NEW.enrollment_id;
  
  -- Récupérer l'ID de la facture associée à l'inscription
  SELECT i.id INTO invoice_id
  FROM invoices i
  WHERE i.enrollment_id = enrollment_id;
  
  -- Mettre à jour le statut de la facture si elle existe
  IF invoice_id IS NOT NULL THEN
    UPDATE invoices
    SET status = 'payé'
    WHERE id = invoice_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger 
        WHERE tgname = 'trigger_update_invoice_status_after_payment'
    ) THEN
        CREATE TRIGGER trigger_update_invoice_status_after_payment
        AFTER INSERT ON payments
        FOR EACH ROW
        EXECUTE FUNCTION update_invoice_status_after_payment();
    END IF;
END $$;
