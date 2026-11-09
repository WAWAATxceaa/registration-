@echo off
chcp 65001 >nul
title ระบบรับสมัครเรียนออนไลน์ (Google Sheets API) - วท.ท่าหลวงซิเมนต์ไทยอนุสรณ์

echo ======================================================================
echo  กำลังเริ่มต้นเซิร์ฟเวอร์ระบบรับสมัครเรียนออนไลน์ (เชื่อมต่อ Google Sheets)
echo ======================================================================
echo.

where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ผิดพลาด] ไม่พบ Node.js ในเครื่อง กรุณาติดตั้ง Node.js จาก https://nodejs.org/
    pause
    exit /b
)

if not exist "node_modules" (
    echo [1/2] กำลังติดตั้ง Dependencies...
    call npm install
)

echo [2/2] กำลังเปิดเซิร์ฟเวอร์ที่ http://localhost:3000 ...
echo.
echo กรุณาอย่าปิดหน้าต่างนี้ขณะใช้งานระบบ
echo สามารถเข้าใช้งานได้ที่ http://localhost:3000
echo.

start http://localhost:3000
node server.js

pause
