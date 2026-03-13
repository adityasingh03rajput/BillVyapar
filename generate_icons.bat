@echo off
echo Generating icons for all platforms...

REM Copy PNG icon to public and build folders
copy icon.png public\favicon.png
copy icon.png build\icon.png

REM For Android icons, we'll use Capacitor's asset generation
echo.
echo Icon setup complete!
echo.
echo Note: For Windows .ico file, you can use an online converter:
echo https://convertio.co/png-ico/
echo Convert icon.png to icon.ico and place it in the build folder
echo.
echo For Android icons, run: npx capacitor-assets generate --android
echo.
pause
