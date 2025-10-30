@echo off
echo ========================================
echo   Configuration du Backend TaskFlow
echo ========================================
echo.

echo Creation du fichier .env...
(
echo PORT=5000
echo MONGODB_URI=mongodb://localhost:27017/task_management
echo JWT_SECRET=task_flow_super_secret_key_2024_change_this_in_production
echo JWT_EXPIRE=7d
echo NODE_ENV=development
echo FRONTEND_URL=http://localhost:3000
) > .env

if exist .env (
    echo ✅ Fichier .env cree avec succes !
    echo.
    echo Contenu du fichier:
    type .env
    echo.
    echo ========================================
    echo   Configuration terminee !
    echo ========================================
    echo.
    echo Prochaines etapes:
    echo 1. Demarrez MongoDB: net start MongoDB
    echo 2. Lancez le serveur: npm start
    echo.
) else (
    echo ❌ Erreur lors de la creation du fichier .env
    pause
    exit /b 1
)

pause
