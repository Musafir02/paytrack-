@echo off
setlocal

set "PROJECT_DIR=%~dp0"

pushd "%PROJECT_DIR%"
if /I "%~1"=="demo" (
    echo Starting PayTrack with demo data...
    mvn spring-boot:run -Dspring-boot.run.profiles=demo
) else (
    echo Starting PayTrack...
    mvn spring-boot:run
)
set "EXIT_CODE=%ERRORLEVEL%"
popd
exit /b %EXIT_CODE%