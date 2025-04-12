const { getAllSchools } = require('../models/schoolModel');

const listSchools = async (req, res) => {
  try {
    const schools = await getAllSchools();
    res.json(schools);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur lors de la récupération des écoles' });
  }
};

module.exports = { listSchools };
