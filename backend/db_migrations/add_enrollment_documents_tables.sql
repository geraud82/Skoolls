-- Création de la table pour les documents d'inscription
CREATE TABLE IF NOT EXISTS enrollment_documents (
  id SERIAL PRIMARY KEY,
  enrollment_id INTEGER NOT NULL,
  document_type VARCHAR(50) NOT NULL,
  file_path TEXT NOT NULL,
  original_filename VARCHAR(255) NOT NULL,
  mime_type VARCHAR(100) NOT NULL,
  description TEXT,
  uploaded_by INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (enrollment_id) REFERENCES enrollments(id) ON DELETE CASCADE,
  FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE CASCADE
);

-- Création de la table pour les documents d'enfant (avant inscription)
CREATE TABLE IF NOT EXISTS child_documents (
  id SERIAL PRIMARY KEY,
  child_id INTEGER NOT NULL,
  document_type VARCHAR(50) NOT NULL,
  file_path TEXT NOT NULL,
  original_filename VARCHAR(255) NOT NULL,
  mime_type VARCHAR(100) NOT NULL,
  description TEXT,
  uploaded_by INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (child_id) REFERENCES children(id) ON DELETE CASCADE,
  FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE CASCADE
);

-- Ajout d'un index pour accélérer les recherches
CREATE INDEX IF NOT EXISTS idx_enrollment_documents_enrollment_id ON enrollment_documents(enrollment_id);
CREATE INDEX IF NOT EXISTS idx_child_documents_child_id ON child_documents(child_id);
