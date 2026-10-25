@echo off
chcp 65001 >nul
title Actualizador de Un Rincon Para Parejas
echo ======================================================================
echo    COPIANDO ARCHIVOS NUEVOS A TU REPOSITORIO DE GITHUB
echo    (12 Mascotas, Tienda de 30 objetos, Cartas mutuas, Sin Lovable)
echo ======================================================================

set "ORIGEN=C:\Users\delac_5w\.gemini\antigravity\scratch\un-rincon-para-parejas"
set "DESTINO=C:\Users\delac_5w\Documents\GitHub\Un-rincon-para-parejas"

echo.
echo [1/3] Copiando codigo fuente (src)...
xcopy "%ORIGEN%\src" "%DESTINO%\src" /E /I /Y /Q

echo.
echo [2/3] Copiando configuracion de Vercel y paquetes...
copy /Y "%ORIGEN%\package.json" "%DESTINO%\package.json" >nul
copy /Y "%ORIGEN%\vercel.json" "%DESTINO%\vercel.json" >nul

echo.
echo [3/3] Verificando...
echo ======================================================================
echo    ¡EXITO! Todos los archivos se copiaron correctamente.
echo.
echo    AHORA:
echo    1. Abre GitHub Desktop.
echo    2. En 'Changes' veras los archivos listos.
echo    3. Abajo escribe 'Version comercial completa' y dale a 'Commit to main'.
echo    4. Arriba dale a 'Push origin'.
echo ======================================================================
echo.
pause
