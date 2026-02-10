@echo off
REM Run the NeuralStack autonomous pipeline from a double-click.
cd /d "%~dp0"
python main.py
echo.
echo Pipeline run finished. Press any key to close this window.
pause >nul

