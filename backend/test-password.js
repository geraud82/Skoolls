const bcrypt = require('bcrypt');

// Mot de passe haché stocké dans la base de données pour l'utilisateur école
const hashedPassword = '$2b$10$X7o4.KTbCOPYnOXj3DXkK.3NkSOqQf4Vl0vVZYwqPoPb9kGp2Qpou';

// Liste de mots de passe courants à tester
const commonPasswords = [
  'password',
  '123456',
  'admin',
  'ecole',
  'test',
  'school',
  'password123',
  'admin123',
  'ecole123',
  'test123',
  'school123',
  'password1',
  'admin1',
  'ecole1',
  'test1',
  'school1',
  // Mots de passe supplémentaires
  'testtest',
  '12345678',
  'qwerty',
  'abc123',
  'letmein',
  'welcome',
  'monkey',
  'dragon',
  'master',
  'sunshine',
  'iloveyou',
  'football',
  'baseball',
  'soccer',
  'basketball',
  'superman',
  'batman',
  'spiderman',
  'starwars',
  'harrypotter',
  'secret',
  'passw0rd',
  'p@ssw0rd',
  'admin@123',
  'root',
  'toor',
  '1234',
  '123',
  'abcd',
  'abcdef',
  'azerty',
  'qwertz',
  'trustno1',
  'shadow',
  'michael',
  'jordan',
  'robert',
  'thomas',
  'jennifer',
  'jessica',
  'daniel',
  'michelle',
  'joshua',
  'charlie',
  'andrew',
  'donald',
  'summer',
  'winter',
  'spring',
  'autumn',
  'january',
  'february',
  'march',
  'april',
  'may',
  'june',
  'july',
  'august',
  'september',
  'october',
  'november',
  'december',
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday',
  'france',
  'paris',
  'london',
  'newyork',
  'tokyo',
  'berlin',
  'madrid',
  'rome',
  'moscow',
  'beijing',
  'sydney',
  'toronto',
  'chicago',
  'losangeles',
  'sanfrancisco',
  'miami',
  'dallas',
  'houston',
  'phoenix',
  'philadelphia',
  'detroit',
  'boston',
  'seattle',
  'denver',
  'atlanta',
  'montreal',
  'vancouver',
  'calgary',
  'edmonton',
  'ottawa',
  'quebec',
  'winnipeg',
  'halifax',
  'victoria',
  'regina',
  'saskatoon',
  'fredericton',
  'charlottetown',
  'stjohns',
  'yellowknife',
  'whitehorse',
  'iqaluit'
];

// Fonction pour tester les mots de passe
async function testPasswords() {
  console.log('Test de mots de passe pour l\'utilisateur école...');
  
  for (const password of commonPasswords) {
    try {
      const match = await bcrypt.compare(password, hashedPassword);
      if (match) {
        console.log(`✅ Mot de passe trouvé: "${password}"`);
        return;
      }
    } catch (err) {
      console.error(`❌ Erreur lors de la comparaison du mot de passe "${password}":`, err);
    }
  }
  
  console.log('❌ Aucun mot de passe correspondant trouvé parmi les mots de passe courants testés.');
}

testPasswords();
