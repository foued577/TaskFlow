const fs = require('fs');
const path = require('path');

const envContent = `PORT=5000
MONGODB_URI=mongodb://localhost:27017/task_management
JWT_SECRET=task_flow_super_secret_key_2024_change_this_in_production
JWT_EXPIRE=7d
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
`;

const envPath = path.join(__dirname, '.env');

fs.writeFileSync(envPath, envContent);
console.log('✅ Fichier .env créé avec succès !');
console.log('📍 Emplacement:', envPath);
console.log('\n📝 Contenu:');
console.log(envContent);
console.log('🚀 Vous pouvez maintenant lancer: npm start');
