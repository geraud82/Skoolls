const db = require('../config/db');

// 🎯 Dashboard Parent
const parentDashboard = async (req, res) => {
  const user_id = req.user.id;

  try {
    const [children, enrollments, payments] = await Promise.all([
      db.query('SELECT COUNT(*) FROM children WHERE user_id = $1', [user_id]),
      db.query(
        `SELECT status, COUNT(*) 
         FROM enrollments e 
         JOIN children c ON e.child_id = c.id 
         WHERE c.user_id = $1 
         GROUP BY status`,
        [user_id]
      ),
      db.query(
        `SELECT COUNT(*) AS total, COALESCE(SUM(amount), 0) AS total_amount 
         FROM payments p 
         JOIN enrollments e ON p.enrollment_id = e.id 
         JOIN children c ON e.child_id = c.id 
         WHERE c.user_id = $1`,
        [user_id]
      )
    ]);

    res.json({
      children_count: parseInt(children.rows[0].count),
      enrollments_by_status: enrollments.rows,
      payments_summary: payments.rows[0]
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur dashboard parent' });
  }
};

// 🎓 Dashboard École
const schoolDashboard = async (req, res) => {
  const school_id = req.user.id;

  try {
    const [classes, enrollments, payments] = await Promise.all([
      db.query('SELECT COUNT(*) FROM classes WHERE school_id = $1', [school_id]),
      db.query(
        `SELECT e.status, COUNT(*) 
         FROM enrollments e 
         JOIN classes cl ON e.class_id = cl.id 
         WHERE cl.school_id = $1 
         GROUP BY e.status`,
        [school_id]
      ),
      db.query(
        `SELECT COUNT(*) AS total, COALESCE(SUM(p.amount), 0) AS total_amount
         FROM payments p
         JOIN enrollments e ON p.enrollment_id = e.id
         JOIN classes cl ON e.class_id = cl.id
         WHERE cl.school_id = $1`,
        [school_id]
      )
    ]);

    res.json({
      classes_count: parseInt(classes.rows[0].count),
      enrollments_by_status: enrollments.rows,
      payments_summary: payments.rows[0]
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur dashboard école' });
  }
};

module.exports = { parentDashboard, schoolDashboard };
