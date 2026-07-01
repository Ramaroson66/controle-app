@echo off
echo ===================================================
echo   CONTROLE - Lancement du Serveur Local
echo ===================================================
cd /d "%~dp0backend"
echo.
echo [1/2] Demarrage du serveur sur http://localhost:3001
echo       (Laissez cette fenetre OUVERTE pendant l'utilisation)
echo.
start http://localhost:3001/agent.html
node index.js
pause
