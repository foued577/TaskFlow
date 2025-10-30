@echo off
title TaskFlow - Demarrage Automatique
color 0A

echo ============================================
echo    TASKFLOW - Demarrage Automatique
echo ============================================
echo.

:: Verifier si on est dans le bon dossier
if not exist "backend" (
    echo Erreur: Dossier backend introuvable
    echo Assurez-vous d'etre dans le dossier planner
    pause
    exit /b 1
)

if not exist "frontend" (
    echo Erreur: Dossier frontend introuvable
    pause
    exit /b 1
)

:: Etape 1: Creer le fichier .env si necessaire
echo [1/5] Verification du fichier .env...
if not exist "backend\.env" (
    echo    Fichier .env manquant, creation en cours...
    cd backend
    (
        echo PORT=5000
        echo MONGODB_URI=mongodb://localhost:27017/task_management
        echo JWT_SECRET=task_flow_super_secret_key_2024_change_this_in_production
        echo JWT_EXPIRE=7d
        echo NODE_ENV=development
        echo FRONTEND_URL=http://localhost:3000
    ) > .env
    cd ..
    echo    ✓ Fichier .env cree
) else (
    echo    ✓ Fichier .env existe deja
)
echo.

:: Etape 2: Demarrer MongoDB
echo [2/5] Demarrage de MongoDB...
sc query MongoDB | find "RUNNING" >nul
if %errorlevel% == 0 (
    echo    ✓ MongoDB est deja demarre
) else (
    echo    Tentative de demarrage de MongoDB...
    net start MongoDB >nul 2>&1
    if %errorlevel% == 0 (
        echo    ✓ MongoDB demarre avec succes
    ) else (
        echo    ⚠ MongoDB n'a pas pu demarrer
        echo    Veuillez demarrer MongoDB manuellement: net start MongoDB
        echo    Ou installez MongoDB depuis: https://www.mongodb.com/try/download/community
        pause
    )
)
echo.

:: Etape 3: Verifier les installations
echo [3/5] Verification des installations...
if not exist "backend\node_modules" (
    echo    Installation backend necessaire...
    cd backend
    call npm install
    cd ..
)
if not exist "frontend\node_modules" (
    echo    Installation frontend necessaire...
    cd frontend
    call npm install
    cd ..
)
echo    ✓ Installations OK
echo.

:: Etape 4: Demarrer le backend
echo [4/5] Demarrage du backend (port 5000)...
echo    Ouverture d'une nouvelle fenetre pour le backend...
start "TaskFlow Backend" cmd /k "cd backend && npm start"
timeout /t 3 >nul
echo    ✓ Backend lance
echo.

:: Etape 5: Demarrer le frontend
echo [5/5] Demarrage du frontend (port 3000)...
echo    Ouverture d'une nouvelle fenetre pour le frontend...
start "TaskFlow Frontend" cmd /k "cd frontend && npm start"
timeout /t 2 >nul
echo    ✓ Frontend lance
echo.

echo ============================================
echo    TaskFlow est en cours de demarrage !
echo ============================================
echo.
echo Backend  : http://localhost:5000
echo Frontend : http://localhost:3000
echo.
echo L'application devrait s'ouvrir automatiquement
echo dans votre navigateur dans quelques secondes...
echo.
echo Pour arreter l'application:
echo - Fermez les fenetres "TaskFlow Backend" et "TaskFlow Frontend"
echo - Ou appuyez sur Ctrl+C dans chaque fenetre
echo.
echo ============================================

:: Attendre un peu avant d'ouvrir le navigateur
timeout /t 8 >nul

:: Ouvrir le navigateur
echo Ouverture du navigateur...
start http://localhost:3000

echo.
echo Vous pouvez fermer cette fenetre.
pause
