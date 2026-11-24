@echo off
title Underground — WebGL GPU Launcher
echo ===================================================
echo   UNDERGROUND: ARENA ANCESTRAL (WEBGL + SHADERS)
echo   Iniciando servidor local na porta 8890...
echo ===================================================

cd /d "%~dp0"

netstat -ano | findstr :8890 >nul
if %errorlevel% neq 0 (
    start /min "UnderGameMainServer" python -m http.server 8890 --bind 127.0.0.1
    timeout /t 1 /nobreak >nul
)

start http://127.0.0.1:8890/index.html
echo.
echo Jogo aberto em http://127.0.0.1:8890/index.html com WebGL completo!
echo Pressione qualquer tecla para fechar esta janela.
pause >nul
