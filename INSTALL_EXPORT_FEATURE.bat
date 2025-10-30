@echo off
title Installation - Fonctionnalite Export Excel
color 0A

echo ============================================
echo   Installation Export Excel - TaskFlow
echo ============================================
echo.

:: Verifier si on est dans le bon dossier
if not exist "backend" (
    echo Erreur: Dossier backend introuvable
    echo Assurez-vous d'etre dans le dossier planner
    pause
    exit /b 1
)

echo [1/3] Installation de la librairie XLSX...
echo.
cd backend
call npm install xlsx
if %errorlevel% neq 0 (
    echo Erreur lors de l'installation de xlsx
    pause
    exit /b 1
)
echo.
echo ✓ XLSX installe avec succes
echo.

echo [2/3] Verification de l'installation...
call npm list xlsx
echo.

echo [3/3] Information
echo.
echo ============================================
echo   Installation terminee avec succes !
echo ============================================
echo.
echo Prochaines etapes:
echo.
echo 1. Redemarrez le backend:
echo    - Arretez le backend (Ctrl+C)
echo    - Lancez: npm start
echo.
echo 2. Rafraichissez le frontend (F5)
echo.
echo 3. Cliquez sur "Exports Excel" dans la sidebar
echo.
echo 4. Commencez a exporter vos donnees !
echo.
echo ============================================
echo.
echo Documentation complete: EXPORT_EXCEL_GUIDE.md
echo.

cd..
pause
