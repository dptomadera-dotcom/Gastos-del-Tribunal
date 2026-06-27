@echo off
title Sincronizador de Google Drive - Gastos del Tribunal
echo =======================================================================
echo Sincronizando codigo de C:\CODER a la unidad virtual G: (Google Drive Cloud)...
echo =======================================================================
echo.

robocopy "C:\CODER\Gastos-del-Tribunal" "G:\Mi unidad\OPOSICIONES 2026\09_PRUEBAS\Gastos-del-Tribunal" /E /XD node_modules .git /XF output.txt sincronizar_drive.bat

echo.
echo =======================================================================
echo ¡Sincronizacion completada! Google Drive subira los archivos a la nube.
echo =======================================================================
pause
