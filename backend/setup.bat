@echo off
echo Creating virtual environment...
python -m venv venv

echo.
echo Activating virtual environment...
call venv\Scripts\activate.bat

echo.
echo Installing dependencies...
pip install --upgrade pip
pip install -r requirements.txt

echo.
echo ============================================
echo Setup complete!
echo.
echo To activate the virtual environment, run:
echo   venv\Scripts\activate
echo.
echo To start the server, run:
echo   uvicorn app.main:app --reload --port 8000
echo ============================================
