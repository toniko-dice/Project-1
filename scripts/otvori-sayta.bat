@echo off
rem Отваря сайта на сървъра през SSH тунел (task-kachvane-server.md, т. 8).
rem Докато този прозорец е отворен: сайтът е на http://localhost:8080,
rem админът - на http://localhost:8080/admin. Затворете прозореца = край.
chcp 65001 >nul
title EcoFlow - тунел към сървъра (не затваряйте, докато ползвате сайта)
echo Тунел към сървъра 91.212.13.155 ...
echo Сайтът:  http://localhost:8080
echo Админът: http://localhost:8080/admin
echo Затворете този прозорец, за да спрете.
start "" cmd /c "timeout /t 3 >nul & start http://localhost:8080"
"%SystemRoot%\System32\OpenSSH\ssh.exe" -N -o ServerAliveInterval=30 -o ExitOnForwardFailure=yes -L 8080:127.0.0.1:80 ecoflow@91.212.13.155
echo.
echo Тунелът е затворен.
pause
