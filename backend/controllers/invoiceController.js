const db = require('../config/db');

const getInvoices = async (req, res) => {
  const user_id = req.user.id;
  
  try {
    const role = await db.query("SELECT role FROM users WHERE id = $1", [user_id]);
    
    if (role.rows.length === 0) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }
    
    let query;
    let params;
    
    if (role.rows[0].role === 'ecole') {
      // Pour les écoles, récupérer toutes les factures liées à leurs classes
      query = `
        SELECT 
          i.id, 
          i.enrollment_id, 
          i.amount, 
          i.status, 
          i.issued_at as created_at,
          ch.user_id as parent_id,
          cl.school_id,
          ch.first_name || ' ' || ch.last_name as child_name,
          cl.name as class_name,
          u_parent.name as parent_name,
          u_school.name as school_name
        FROM invoices i
        JOIN enrollments e ON i.enrollment_id = e.id
        JOIN children ch ON e.child_id = ch.id
        JOIN classes cl ON e.class_id = cl.id
        JOIN users u_parent ON ch.user_id = u_parent.id
        JOIN users u_school ON cl.school_id = u_school.id
        WHERE cl.school_id = $1
        ORDER BY i.issued_at DESC
      `;
      params = [user_id];
    } else {
      // Pour les parents, récupérer toutes les factures liées à leurs enfants
      query = `
        SELECT 
          i.id, 
          i.enrollment_id, 
          i.amount, 
          i.status, 
          i.issued_at as created_at,
          ch.user_id as parent_id,
          cl.school_id,
          ch.first_name || ' ' || ch.last_name as child_name,
          cl.name as class_name,
          u_parent.name as parent_name,
          u_school.name as school_name
        FROM invoices i
        JOIN enrollments e ON i.enrollment_id = e.id
        JOIN children ch ON e.child_id = ch.id
        JOIN classes cl ON e.class_id = cl.id
        JOIN users u_parent ON ch.user_id = u_parent.id
        JOIN users u_school ON cl.school_id = u_school.id
        WHERE ch.user_id = $1
        ORDER BY i.issued_at DESC
      `;
      params = [user_id];
    }
    
    const result = await db.query(query, params);
    
    // Ajouter un numéro de facture généré à partir de l'ID
    const invoicesWithNumber = result.rows.map(invoice => ({
      ...invoice,
      invoice_number: `INV-${String(invoice.id).padStart(6, '0')}`,
      amount: parseFloat(invoice.amount)
    }));
    
    res.json(invoicesWithNumber);
  } catch (err) {
    console.error('Erreur SQL getInvoices: ', err);
    res.status(500).json({ message: "Erreur lors de la récupération des factures", error: err.message });
  }
};

module.exports = {
  getInvoices
};
