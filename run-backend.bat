@echo off
cd backend
node create-tables.js
node run-migrations.js
node create-test-user.js
node index.js
