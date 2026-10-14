@echo off
setlocal
cd /d "%~dp0"
set "PATH=%ProgramFiles%\nodejs;%ProgramFiles%\Git\cmd;%PATH%"
where npm.cmd >nul 2>nul
if errorlevel 1 (
  echo Node.js non trovato. Chiedi a Codex di completare la configurazione.
  pause
  exit /b 1
)
if not exist "node_modules\expo\bin\cli" (
  echo Preparo l'app per il primo avvio. Potrebbero servire alcuni minuti.
  call npm.cmd ci
  if errorlevel 1 (
    echo Preparazione non riuscita. Chiedi a Codex di risolvere il problema.
    pause
    exit /b 1
  )
)
echo Avvio di ChefSuggest. Lascia aperta questa finestra durante l'uso.
echo Per terminare premi Ctrl+C.
call npm.cmd run preview
if errorlevel 1 (
  echo L'avvio non e riuscito. Copia il messaggio di errore in Codex.
  pause
  exit /b 1
)
