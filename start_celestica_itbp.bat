@echo off
chcp 65001 >nul
title Celestica IT Business Partner 2 Console (Req ID: 133553)
cd /d "%~dp0"
echo ============================================================================
echo   Celestica (Thailand) Limited ^& Celestica Japan K.K.
echo   Manager, IT Business Partner 2 (Req ID: 133553 - Band 10 - Laem Chabang)
echo   Strategic ITBP Console, Trello Kanban, Primavera P6 ^& A4 Print Suite
echo ============================================================================
echo.
echo   Starting SQLite WAL Server on http://localhost:3040/celestica ...
start "" "http://localhost:3040/celestica"
node celestica_server.js
pause
