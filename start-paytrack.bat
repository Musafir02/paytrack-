@echo off
setlocal

set "PROJECT_DIR=%~dp0"
set "PG_BIN=%USERPROFILE%\Downloads\postgresql-17.11-4-windows-x64-binaries\pgsql\bin"
set "PG_DATA=%LOCALAPPDATA%\PayTrack\postgres-data"

if not exist "%PG_BIN%\pg_ctl.exe" (
    echo PostgreSQL was not found at "%PG_BIN%".
    echo Check the PostgreSQL binaries path in start-paytrack.bat.
    pause
    exit /b 1
)

if not exist "%PG_DATA%\PG_VERSION" (
    echo PostgreSQL data directory was not found at "%PG_DATA%".
    echo Initialize the local database before starting PayTrack.
    pause
    exit /b 1
)

"%PG_BIN%\pg_ctl.exe" -D "%PG_DATA%" status >nul 2>&1
if errorlevel 1 (
    echo Starting PostgreSQL...
    "%PG_BIN%\pg_ctl.exe" -D "%PG_DATA%" -l "%PG_DATA%\server.log" -o "-h localhost -p 5432" -w start
    if errorlevel 1 (
        echo PostgreSQL could not start. See "%PG_DATA%\server.log".
        pause
        exit /b 1
    )
)

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