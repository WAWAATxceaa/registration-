@echo off
chcp 65001 >nul
echo ======================================================================
echo   ระบบรับสมัครเรียนออนไลน์ - สคริปต์นำโครงการขึ้น GitHub
echo ======================================================================
echo.

where git >nul 2>nul
if %errorlevel% neq 0 (
    echo [ผิดพลาด] ไม่พบโปรแกรม Git ในเครื่อง กรุณาติดตั้ง Git ก่อนที่ https://git-scm.com/
    pause
    exit /b
)

REM ตรวจสอบว่าเคยมี .git หรือยัง
if not exist ".git" (
    echo [1/4] กำลังเริ่มต้น Git repository (git init)...
    git init
    git branch -M main
) else (
    echo [1/4] พบ Git repository เดิมอยู่แล้ว
)

echo [2/4] กำลังรวบรวมไฟล์ทั้งหมด (git add)...
git add .

echo [3/4] กำลังบันทึกการเปลี่ยนแปลง (git commit)...
git commit -m "อัปเดตระบบรับสมัครเรียนออนไลน์" >nul 2>&1

echo.
echo ======================================================================
echo  ขั้นตอนการเชื่อมต่อกับ GitHub:
echo   1. ไปที่เว็บไซต์ https://github.com
echo   2. กดปุ่ม New (สีเขียว) หรือเครื่องหมาย + ด้านบนขวา เพื่อสร้าง Repository ใหม่
echo   3. ตั้งชื่อ Repository เช่น registration-system แล้วกด "Create repository"
echo   4. คัดลอกลิงก์ HTTPS ของ Repository นั้นมาวางที่นี่
echo      ตัวอย่าง: https://github.com/your-username/registration-system.git
echo ======================================================================
echo.

set /p REPO_URL="กรุณาวาง GitHub Repository URL: "

if "%REPO_URL%"=="" (
    echo [ผิดพลาด] ไม่ได้กรอก URL กรุณาลองใหม่อีกครั้ง
    pause
    exit /b
)

echo.
echo [4/4] กำลังเชื่อมต่อและนำโค้ดขึ้น GitHub (git push)...
git remote remove origin 2>nul
git remote add origin %REPO_URL%
git branch -M main
git push -u origin main

if %errorlevel% equ 0 (
    echo.
    echo ======================================================================
    echo  [สำเร็จ!] โค้ดถูกนำขึ้น GitHub เรียบร้อยแล้ว!
    echo ======================================================================
    echo.
    echo ต้องการเปิดให้ใช้งานเป็นเว็บไซต์ออนไลน์ฟรี (GitHub Pages) หรือไม่?
    echo ทำได้ง่ายๆ เพียง:
    echo  1. เข้าหน้า GitHub Repository ของคุณ
    echo  2. คลิกแท็บ "Settings" ด้านบน -> เมนูด้านซ้ายเลือก "Pages"
    echo  3. ที่หัวข้อ "Build and deployment" (Branch):
    echo     - เปลี่ยนจาก "None" เป็น "main"
    echo     - โฟลเดอร์เลือก "/(root)"
    echo     - กด "Save"
    echo  4. รอประมาณ 1-2 นาที คุณจะได้ลิงก์เว็บไซต์ใช้งานได้จริงทันที!
    echo.
) else (
    echo.
    echo [แจ้งเตือน] ไม่สามารถ Push ขึ้น GitHub ได้ กรุณาตรวจสอบ:
    echo  1. ลิงก์ URL ถูกต้องหรือไม่
    echo  2. มีสิทธิ์เข้าถึง หรือล็อกอิน GitHub ในหน้าต่างยืนยันตัวตนแล้วหรือยัง
)

pause
