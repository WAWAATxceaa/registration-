require('dotenv').config();
const path = require('path');
const express = require('express');
const cors = require('cors');
const sheetsService = require('./sheetsService');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, HEAD');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.setHeader('Access-Control-Allow-Private-Network', 'true');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }
  next();
});
app.use(cors());
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

// Request logging
app.use((req, res, next) => {
  if (req.url.startsWith('/api')) {
    console.log(`[API ${req.method}] ${req.url}`);
  }
  next();
});

// เสิร์ฟไฟล์ Static ของหน้าเว็บเดิม (index.html, css, js, assets) จาก Express ตัวเดียวกัน
app.use(express.static(path.join(__dirname)));

// ฟังก์ชันตรวจสอบความถูกต้องของเลขประจำตัวประชาชน 13 หลัก
function validateThaiNationalID(id) {
  if (!id) return false;
  const cleanId = String(id).replace(/\D/g, '');
  if (cleanId.length !== 13) return false;
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    sum += parseInt(cleanId.charAt(i), 10) * (13 - i);
  }
  const checkDigit = (11 - (sum % 11)) % 10;
  return checkDigit === parseInt(cleanId.charAt(12), 10);
}

// ============================================================================
// API ROUTES
// ============================================================================

// 0. ตรวจสอบสถานะการเชื่อมต่อระบบและ Google Sheets
app.get('/api/health', async (req, res, next) => {
  try {
    const headers = await sheetsService.ensureHeaders();
    res.json({
      success: true,
      status: 'online',
      spreadsheetId: process.env.SPREADSHEET_ID,
      sheetName: sheetsService.sheetName,
      columnsCount: headers.length,
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    next(err);
  }
});

// 1. GET /api/applicants: อ่านข้อมูลผู้สมัครทั้งหมด (Requirement 4)
app.get('/api/applicants', async (req, res, next) => {
  try {
    const applicants = await sheetsService.getAllApplicants();

    // กรองตาม nationalId สำหรับหน้าตรวจสอบสถานะของผู้สมัคร
    if (req.query.nationalId) {
      const cleanNationalId = String(req.query.nationalId).trim();
      const matched = applicants.slice().reverse().find(a => a.nationalId === cleanNationalId);
      if (!matched) {
        return res.status(404).json({
          success: false,
          message: 'ไม่พบข้อมูลการสมัครของเลขประจำตัวประชาชนนี้'
        });
      }
      return res.json({
        success: true,
        data: matched
      });
    }

    // กรองตาม applicationNo
    if (req.query.applicationNo) {
      const cleanAppNo = String(req.query.applicationNo).trim();
      const matched = applicants.find(a => a.applicationNo === cleanAppNo);
      if (!matched) {
        return res.status(404).json({
          success: false,
          message: 'ไม่พบใบสมัครตามเลขที่ที่ระบุ'
        });
      }
      return res.json({
        success: true,
        data: matched
      });
    }

    // คืนค่ารายการทั้งหมด
    res.json({
      success: true,
      count: applicants.length,
      data: applicants
    });
  } catch (err) {
    next(err);
  }
});

// 2. GET /api/applicants/:id: อ่านข้อมูลผู้สมัครรายบุคคลตาม id หรือ applicationNo
app.get('/api/applicants/:id', async (req, res, next) => {
  try {
    const applicant = await sheetsService.getApplicantById(req.params.id);
    if (!applicant) {
      return res.status(404).json({
        success: false,
        message: 'ไม่พบข้อมูลผู้สมัคร'
      });
    }
    res.json({
      success: true,
      data: applicant
    });
  } catch (err) {
    next(err);
  }
});

// 3. POST /api/applicants: เพิ่มข้อมูลผู้สมัครใหม่ (Requirement 4: พร้อม Validation)
app.post('/api/applicants', async (req, res, next) => {
  try {
    const data = req.body.data || req.body;

    // --- Validation ---
    const errors = [];
    if (!data.level) errors.push('กรุณาระบุระดับการศึกษาที่ต้องการสมัคร (ปวช. หรือ ปวส.)');
    if (!data.title) errors.push('กรุณาเลือกคำนำหน้าชื่อ');
    if (!data.fullName || !data.fullName.trim()) errors.push('กรุณากรอกชื่อ - นามสกุล');
    if (!data.birthDate || !data.birthDate.trim()) errors.push('กรุณาระบุวัน/เดือน/ปีเกิด');

    const cleanNationalId = String(data.nationalId || '').trim();
    if (!cleanNationalId) {
      errors.push('กรุณากรอกเลขประจำตัวประชาชน 13 หลัก');
    } else if (!validateThaiNationalID(cleanNationalId)) {
      errors.push('เลขประจำตัวประชาชน 13 หลักไม่ถูกต้องตามหลักการคำนวณ');
    }

    const cleanPhone = String(data.phone || '').trim();
    if (!cleanPhone) {
      errors.push('กรุณากรอกหมายเลขโทรศัพท์');
    } else if (!/^0\d{9}$/.test(cleanPhone)) {
      errors.push('หมายเลขโทรศัพท์ต้องเป็นตัวเลขอารบิก 10 หลัก และขึ้นต้นด้วย 0 (เช่น 0812345678)');
    }

    if (data.gpax !== undefined && data.gpax !== '') {
      const numGpax = parseFloat(data.gpax);
      if (isNaN(numGpax) || numGpax < 0 || numGpax > 4) {
        errors.push('ผลการเรียนเฉลี่ยสะสม (GPAX) ต้องเป็นตัวเลขระหว่าง 0.00 ถึง 4.00');
      }
    }

    if (!data.branchOrder1) errors.push('กรุณาเลือกสาขาวิชาที่ต้องการสมัคร (อันดับ 1)');
    if (data.level === 'ปวช.' && !data.branchOrder2) {
      errors.push('ระดับ ปวช. กรุณาเลือกสาขาวิชาลำดับที่ 2');
    }

    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        message: errors.join('\n'),
        errors
      });
    }

    const created = await sheetsService.addApplicant(data);
    res.status(201).json({
      success: true,
      message: 'บันทึกข้อมูลการสมัครเรียนเรียบร้อยแล้ว',
      applicationNo: created.applicationNo,
      academicYear: created.academicYear,
      timestamp: created.submittedAt,
      id: created.id,
      data: created
    });
  } catch (err) {
    next(err);
  }
});

// 4. PUT /api/applicants/:id: แก้ไขข้อมูลผู้สมัครตาม id หรือ applicationNo (Requirement 4)
app.put('/api/applicants/:id', async (req, res, next) => {
  try {
    const updateData = req.body.data || req.body;

    // ถ้ามีการแก้ไขเลขบัตรประชาชน ตรวจสอบความถูกต้อง
    if (updateData.nationalId) {
      const cleanNationalId = String(updateData.nationalId).trim();
      if (!validateThaiNationalID(cleanNationalId)) {
        return res.status(400).json({
          success: false,
          message: 'เลขประจำตัวประชาชน 13 หลักไม่ถูกต้อง'
        });
      }
    }

    const updated = await sheetsService.updateApplicant(req.params.id, updateData);
    res.json({
      success: true,
      message: 'แก้ไขข้อมูลผู้สมัครสำเร็จ',
      data: updated
    });
  } catch (err) {
    next(err);
  }
});

// 5. DELETE /api/applicants/:id: ลบแถวจริงด้วย batchUpdate deleteDimension (Requirement 4)
app.delete('/api/applicants/:id', async (req, res, next) => {
  try {
    const result = await sheetsService.deleteApplicant(req.params.id);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

// Route เสริม: อัปเดตสถานะ (updateStatus)
app.post('/api/applicants/:id/status', async (req, res, next) => {
  try {
    const { status, staffNote, operator } = req.body;
    if (!status) {
      return res.status(400).json({ success: false, message: 'กรุณาระบุสถานะใหม่' });
    }
    const updated = await sheetsService.updateApplicant(req.params.id, {
      status,
      staffNote: staffNote !== undefined ? staffNote : undefined
    });
    res.json({
      success: true,
      message: 'บันทึกการเปลี่ยนสถานะเรียบร้อยแล้ว',
      data: updated
    });
  } catch (err) {
    next(err);
  }
});

// Route เสริม: มอบตัวนักศึกษา (enrollStudent)
app.post('/api/applicants/:id/enroll', async (req, res, next) => {
  try {
    const { enrolledNotes, staffUser } = req.body;
    const applicant = await sheetsService.getApplicantById(req.params.id);
    if (!applicant) {
      return res.status(404).json({ success: false, message: 'ไม่พบใบสมัคร' });
    }

    // ออกรหัสนักศึกษาอัตโนมัติ เช่น 70201010002
    const all = await sheetsService.getAllApplicants();
    const prefix = '702010';
    let maxNum = 0;
    all.forEach(a => {
      if (a.studentId && a.studentId.startsWith(prefix)) {
        const num = parseInt(a.studentId.replace(prefix, ''), 10);
        if (!isNaN(num) && num > maxNum) maxNum = num;
      }
    });
    const studentId = `${prefix}${String(maxNum + 1).padStart(5, '0')}`;

    const now = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    const enrolledAt = `${now.getFullYear() + 543}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
    const operator = staffUser && staffUser.fullName ? staffUser.fullName : 'เจ้าหน้าที่ทะเบียน';

    const updated = await sheetsService.updateApplicant(req.params.id, {
      status: 'มอบตัวแล้ว',
      studentId: studentId,
      enrolledAt: enrolledAt,
      enrolledBy: operator,
      staffNote: enrolledNotes || applicant.staffNote || ''
    });

    res.json({
      success: true,
      message: 'บันทึกการมอบตัวสำเร็จ',
      studentId: studentId,
      data: updated
    });
  } catch (err) {
    next(err);
  }
});

// เสิร์ฟหน้า index.html สำหรับเส้นทางทั่วไป (SPA fallback)
app.use((req, res, next) => {
  if (req.method === 'GET' && !req.path.startsWith('/api')) {
    return res.sendFile(path.join(__dirname, 'index.html'));
  }
  next();
});

// ============================================================================
// Global Error Handler (Requirement 7: อ่านเข้าใจง่าย ไม่เปิดเผย Key)
// ============================================================================
app.use((err, req, res, next) => {
  const status = err.statusCode || 500;
  // ล้างข้อความที่อาจมี key หรือ token ออก
  const safeMessage = (err.message || 'เกิดข้อผิดพลาดภายในระบบ')
    .replace(/AIza[0-9A-Za-z-_]{35}/g, '***')
    .replace(/bearer [a-z0-9._-]+/gi, 'Bearer ***');

  console.error(`[Server Error] [${req.method} ${req.url}] Status: ${status} -`, safeMessage);

  res.status(status).json({
    success: false,
    message: safeMessage
  });
});

// เริ่มทำงานเซิร์ฟเวอร์
if (require.main === module) {
  app.listen(PORT, async () => {
    console.log(`======================================================================`);
    console.log(` ระบบรับสมัครเรียนออนไลน์ วิทยาลัยเทคนิคท่าหลวงซิเมนต์ไทยอนุสรณ์`);
    console.log(` เซิร์ฟเวอร์ทำงานที่: http://localhost:${PORT}`);
    console.log(` Google Sheets ID: ${process.env.SPREADSHEET_ID}`);
    console.log(` Sheet Tab: ${process.env.SHEET_NAME || 'ชีต1'}`);
    console.log(`======================================================================`);

    try {
      const headers = await sheetsService.ensureHeaders();
      console.log(`[Google Sheets] เชื่อมต่อสำเร็จ พร้อมหัวคอลัมน์ ${headers.length} รายการ`);
    } catch (err) {
      console.error(`[Google Sheets] คำเตือน: ตรวจสอบการเชื่อมต่อชีตเริ่มต้น -`, err.message);
    }
  });
}

module.exports = app;
