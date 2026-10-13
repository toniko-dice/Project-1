@echo off
rem Otvarya sayta na sarvara prez SSH tunel (task-kachvane-server.md, t. 8).
rem Faylat e samo s latinitsa: cmd chete .bat v staria kodov red i kirilitsata go chupi.
title EcoFlow - tunel kam sarvara (ne zatvaryayte, dokato polzvate sayta)
echo.
echo  EcoFlow - tunel kam sarvara 91.212.13.155
echo.
echo  Saytat:  http://localhost:8080
echo  Adminat: http://localhost:8080/admin
echo.
echo  Dokato tozi prozorets e otvoren, saytat raboti.
echo  Zatvorete prozoretsa, za da sprete tunela.
echo.
start "" /min cmd /c "timeout /t 3 /nobreak >nul & start http://localhost:8080"
"%SystemRoot%\System32\OpenSSH\ssh.exe" -N -o ServerAliveInterval=30 -o ExitOnForwardFailure=yes -L 8080:127.0.0.1:8081 ecoflow@91.212.13.155
echo.
echo  Tunelat e zatvoren (ili ne se svarza - vizhte greshkata po-gore).
pause
