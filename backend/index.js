// 📦 Chargement des modules
const express = require('express');
const cors = require('cors');
require('dotenv').config();
const db = require('./config/db'); // Connexion à la base de données

const app = express();
const PORT = process.env.PORT || 5000;

// ✅ Middlewares globaux
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads')); // Servir les fichiers statiques du dossier uploads

// ✅ Import des routes
const authRoutes = require('./routes/authRoutes');
const classRoutes = require('./routes/classRoutes');
const schoolRoutes = require('./routes/schoolRoutes');
const childRoutes = require('./routes/childRoutes');
const enrollmentRoutes = require('./routes/enrollmentRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const reportRoutes = require('./routes/reportRoutes');
const documentRoutes = require('./routes/documentRoutes');
const testRoutes = require('./routes/testRoutes');
const invoiceRoutes = require('./routes/invoiceRoutes');
const receiptRoutes = require('./routes/receiptRoutes');
const profileRoutes = require('./routes/profileRoutes');
const adminRoutes = require('./routes/adminRoutes');
const messageRoutes = require('./routes/messageRoutes'); // Routes pour la messagerie
// ✅ Utilisation des routes
app.use('/api/auth', authRoutes);
app.use('/api/classes', classRoutes);
app.use('/api/schools', schoolRoutes);
app.use('/api/children', childRoutes);
app.use('/api/enrollments', enrollmentRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/documents', documentRoutes); // Routes pour les documents d'inscription
app.use('/api/test', testRoutes);
app.use('/api/invoices', invoiceRoutes); // Routes pour les factures
app.use('/api/receipts', receiptRoutes); // Routes pour les reçus
app.use('/api/profile', profileRoutes); // Routes pour le profil utilisateur
app.use('/api/admin', adminRoutes); // Routes pour l'administration
app.use('/api/messages', messageRoutes); // Routes pour la messagerie


// ✅ Route par défaut
app.get('/', (req, res) => res.send('✅ SchoolPay API is running'));

// ✅ Lancement du serveur
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
