@echo off
echo ========================================
echo BillBuddy Complete Build Process
echo ========================================
echo.

REM Step 1: Build the web app
echo [1/4] Building web application...
call npm run build
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Web build failed!
    pause
    exit /b 1
)

echo.
echo [2/4] Syncing Capacitor with Android...
call npx cap sync android
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Capacitor sync failed!
    pause
    exit /b 1
)

echo.
echo [3/4] Building Android release APK...
cd android
call gradlew assembleRelease --build-cache --parallel
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Android build failed!
    cd ..
    pause
    exit /b 1
)
cd ..

echo.
echo [4/4] Copying APK to main folder...
copy "android\app\build\outputs\apk\release\app-release.apk" "BillBuddy-Release.apk" /Y

echo.
echo ========================================
echo BUILD COMPLETE!
echo ========================================
echo.
echo APK Location: BillBuddy-Release.apk
echo.
echo To install on device:
echo adb install -r BillBuddy-Release.apk
echo.
pause
