const { createClass, getClassesBySchool, getClassById, getAllClasses } = require('../models/classModel');
const db = require('../config/db');

const getClassesBySchoolId = async (req, res) => {
  const { schoolId } = req.params;
  try {
    const classes = await getClassesBySchool(schoolId);
    res.json(classes);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur lors de la récupération des classes' });
  }
};

const addClass = async (req, res) => {
  const { name, tuition_fee, registration_fee, payment_installments, payment_deadlines, waive_registration_fee_for_returning_students } = req.body;
  const school_id = req.user.id; // récupéré via JWT middleware
  try {
    const newClass = await createClass({ 
      school_id, 
      name, 
      tuition_fee, 
      registration_fee, 
      payment_installments, 
      payment_deadlines,
      waive_registration_fee_for_returning_students
    });
    res.status(201).json(newClass);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur lors de la création de la classe' });
  }
};

const listClasses = async (req, res) => {
  const school_id = req.user.id;
  try {
    const classes = await getClassesBySchool(school_id);
    res.json(classes);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur lors de la récupération des classes' });
  }
};

const getClass = async (req, res) => {
  const { id } = req.params;
  try {
    const classObj = await getClassById(id);
    if (!classObj) {
      return res.status(404).json({ message: 'Classe non trouvée' });
    }
    res.json(classObj);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur lors de la récupération de la classe' });
  }
};

const listAllClasses = async (req, res) => {
  try {
    const classes = await getAllClasses();
    res.json(classes);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur lors de la récupération des classes' });
  }
};
const deleteClass = async (req, res) => {
  const classId = req.params.id;

  try {
    await db.query('DELETE FROM classes WHERE id = $1', [classId]);
    res.status(200).json({ message: 'Classe supprimée.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

const updateClass = async (req, res) => {
  const classId = req.params.id;
  const { name, tuition_fee, registration_fee, payment_installments, payment_deadlines, waive_registration_fee_for_returning_students } = req.body;

  try {
    const result = await db.query(
      'UPDATE classes SET name = $1, tuition_fee = $2, registration_fee = $3, payment_installments = $4, payment_deadlines = $5, waive_registration_fee_for_returning_students = $6 WHERE id = $7 RETURNING *',
      [name, tuition_fee, registration_fee || 0, payment_installments || '[]', payment_deadlines || '[]', waive_registration_fee_for_returning_students || false, classId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'Classe non trouvée.' });
    }

    res.status(200).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

module.exports = { addClass, listClasses, getClass, listAllClasses, deleteClass, updateClass, getClassesBySchoolId };
