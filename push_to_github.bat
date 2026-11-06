@echo off
chcp 65001 >nul
echo ======================================================================
echo  ระบบรับสมัครเรียนออนไลน์ (โควตา 2570) - วท.ท่าหลวงซิเมนต์ไทยอนุสรณ์
echo  สคริปต์นำโครงการขึ้น GitHub และ GitHub Pages
echo ======================================================================
echo.

set PATH=C:\Users\TL\.mingit\cmd;%PATH%

echo กรุณาสร้าง Repository เปล่าบน GitHub (เช่น thaluang-admission-2570)
echo จากนั้นคัดลอก URL ของ Repository มาวางที่นี่
echo ตัวอย่าง: https://github.com/YourUsername/thaluang-admission-2570.git
echo.
set /p REPO_URL="กรุณากรอก GitHub Repository URL: "

if "%REPO_URL%"=="" (
    echo [ผิดพลาด] ไม่ได้กรอก URL กรุณาลองใหม่อีกครั้ง
    pause
    exit /b
)

echo.
echo กำลังตั้งค่า Remote และนำโค้ดขึ้น GitHub...
git remote remove origin 2>nul
git remote add origin %REPO_URL%
git branch -M main
git push -u origin main

if %errorlevel% equ 0 (
    echo.
    echo ======================================================================
    echo  [สำเร็จ] โค้ดถูกนำขึ้น GitHub เรียบร้อยแล้ว!
    echo ======================================================================
    echo.
    echo ขั้นตอนถัดไปเพื่อเปิดให้ใช้งานออนไลน์ (GitHub Pages):
    echo  1. ไปที่หน้า GitHub Repository ของคุณ
    echo  2. คลิกแท็บ "Settings" ^> เมนูด้านซ้ายเลือก "Pages"
    echo  3. ที่หัวข้อ "Build and deployment" ^> Source เลือก "Deploy from a branch"
    echo  4. เลือก Branch: "main" และโฟลเดอร์ "/(root)" ^> กด "Save"
    echo  5. รอประมาณ 1 นาที เว็บไซต์จะออนไลน์พร้อมใช้งานทันที!
    echo.
) else (
    echo.
    echo [แจ้งเตือน] การ Push ไม่สำเร็จ กรุณาตรวจสอบ URL หรือการยืนยันตัวตนบน GitHub
)

pause
