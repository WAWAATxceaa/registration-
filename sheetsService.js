const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { google } = require('googleapis');

// รายการคอลัมน์มาตรฐานของระบบรับสมัคร (ตามที่ระบุในข้อกำหนด: id, วันที่ส่งข้อมูล, สถานะ อยู่ด้านหน้า)
const COLUMN_DEFINITIONS = [
  { key: 'id', header: 'id', aliases: ['id', 'ID', 'uuid', 'UUID'] },
  { key: 'submittedAt', header: 'วันที่ส่งข้อมูล', aliases: ['วันที่ส่งข้อมูล', 'timestamp', 'Timestamp', 'วันเวลาที่สมัคร'] },
  { key: 'status', header: 'สถานะ', aliases: ['สถานะ', 'status', 'Status'] },
  { key: 'applicationNo', header: 'เลขที่ใบสมัคร', aliases: ['เลขที่ใบสมัคร', 'applicationNo', 'ApplicationNo'] },
  { key: 'academicYear', header: 'ปีการศึกษา', aliases: ['ปีการศึกษา', 'academicYear', 'AcademicYear'] },
  { key: 'level', header: 'ระดับการศึกษา', aliases: ['ระดับการศึกษา', 'level', 'Level'] },
  { key: 'title', header: 'คำนำหน้า', aliases: ['คำนำหน้า', 'title', 'Title'] },
  { key: 'fullName', header: 'ชื่อ-นามสกุล', aliases: ['ชื่อ-นามสกุล', 'fullName', 'FullName', 'ชื่อ - นามสกุล'] },
  { key: 'birthDate', header: 'วันเดือนปีเกิด', aliases: ['วันเดือนปีเกิด', 'birthDate', 'BirthDate', 'วัน/เดือน/ปีเกิด'] },
  { key: 'nationalId', header: 'เลขประจำตัวประชาชน', aliases: ['เลขประจำตัวประชาชน', 'nationalId', 'NationalID', 'เลขบัตรประชาชน'] },
  { key: 'fatherName', header: 'ชื่อบิดา', aliases: ['ชื่อบิดา', 'fatherName', 'FatherName', 'ชื่อ - นามสกุล บิดา'] },
  { key: 'fatherAge', header: 'อายุบิดา', aliases: ['อายุบิดา', 'fatherAge', 'FatherAge'] },
  { key: 'fatherJob', header: 'อาชีพบิดา', aliases: ['อาชีพบิดา', 'fatherJob', 'FatherJob'] },
  { key: 'motherName', header: 'ชื่อมารดา', aliases: ['ชื่อมารดา', 'motherName', 'MotherName', 'ชื่อ - นามสกุล มารดา'] },
  { key: 'motherAge', header: 'อายุมารดา', aliases: ['อายุมารดา', 'motherAge', 'MotherAge'] },
  { key: 'motherJob', header: 'อาชีพมารดา', aliases: ['อาชีพมารดา', 'motherJob', 'MotherJob'] },
  { key: 'addressHouseNo', header: 'บ้านเลขที่', aliases: ['บ้านเลขที่', 'addressHouseNo', 'AddressHouseNo'] },
  { key: 'addressMoo', header: 'หมู่', aliases: ['หมู่', 'addressMoo', 'AddressMoo', 'หมู่ที่'] },
  { key: 'addressSoi', header: 'ซอย', aliases: ['ซอย', 'addressSoi', 'AddressSoi', 'ตรอก/ซอย'] },
  { key: 'addressRoad', header: 'ถนน', aliases: ['ถนน', 'addressRoad', 'AddressRoad'] },
  { key: 'addressSubdistrict', header: 'ตำบล/แขวง', aliases: ['ตำบล/แขวง', 'addressSubdistrict', 'AddressSubdistrict', 'ตำบล'] },
  { key: 'addressDistrict', header: 'อำเภอ/เขต', aliases: ['อำเภอ/เขต', 'addressDistrict', 'AddressDistrict', 'อำเภอ'] },
  { key: 'addressProvince', header: 'จังหวัด', aliases: ['จังหวัด', 'addressProvince', 'AddressProvince'] },
  { key: 'addressPostalCode', header: 'รหัสไปรษณีย์', aliases: ['รหัสไปรษณีย์', 'addressPostalCode', 'AddressPostalCode'] },
  { key: 'phone', header: 'เบอร์โทรศัพท์', aliases: ['เบอร์โทรศัพท์', 'phone', 'Phone', 'หมายเลขโทรศัพท์'] },
  { key: 'currentLevel', header: 'ระดับการศึกษาเดิม', aliases: ['ระดับการศึกษาเดิม', 'currentLevel', 'CurrentLevel'] },
  { key: 'schoolName', header: 'สถานศึกษาเดิม', aliases: ['สถานศึกษาเดิม', 'schoolName', 'SchoolName'] },
  { key: 'schoolLocation', header: 'ที่ตั้งสถานศึกษา', aliases: ['ที่ตั้งสถานศึกษา', 'schoolLocation', 'SchoolLocation'] },
  { key: 'gpax', header: 'GPAX', aliases: ['GPAX', 'gpax', 'ผลการเรียนเฉลี่ย'] },
  { key: 'oldMajor', header: 'สาขาวิชาเดิม', aliases: ['สาขาวิชาเดิม', 'oldMajor', 'OldMajor'] },
  { key: 'branchOrder1', header: 'สาขาอันดับ 1', aliases: ['สาขาอันดับ 1', 'branchOrder1', 'BranchOrder1'] },
  { key: 'branchOrder2', header: 'สาขาอันดับ 2', aliases: ['สาขาอันดับ 2', 'branchOrder2', 'BranchOrder2'] },
  { key: 'staffNote', header: 'หมายเหตุเจ้าหน้าที่', aliases: ['หมายเหตุเจ้าหน้าที่', 'staffNote', 'StaffNote', 'หมายเหตุ'] },
  { key: 'studentId', header: 'รหัสนักศึกษา', aliases: ['รหัสนักศึกษา', 'studentId', 'StudentID'] },
  { key: 'enrolledAt', header: 'วันเวลาที่มอบตัว', aliases: ['วันเวลาที่มอบตัว', 'enrolledAt', 'EnrolledAt'] },
  { key: 'enrolledBy', header: 'ผู้บันทึกมอบตัว', aliases: ['ผู้บันทึกมอบตัว', 'enrolledBy', 'EnrolledBy'] }
];

const DEFAULT_HEADERS = COLUMN_DEFINITIONS.map(c => c.header);

class SheetsService {
  constructor() {
    this.sheets = null;
    this.spreadsheetId = process.env.SPREADSHEET_ID;
    this.sheetName = process.env.SHEET_NAME || 'ชีต1';
    this.sheetId = null; // integer id from properties.sheetId for batchUpdate
    this.headers = [];
  }

  // สร้าง Google Sheets API Client
  getSheetsClient() {
    if (this.sheets) return this.sheets;

    let credsData;

    if (process.env.GOOGLE_CREDENTIALS_JSON && process.env.GOOGLE_CREDENTIALS_JSON.trim()) {
      try {
        credsData = JSON.parse(process.env.GOOGLE_CREDENTIALS_JSON);
      } catch (e) {
        throw new Error('รูปแบบ GOOGLE_CREDENTIALS_JSON ไม่ถูกต้อง (ต้องเป็น JSON ที่สมบูรณ์)');
      }
    } else if (process.env.GOOGLE_CREDENTIALS_FILE) {
      const keyPath = path.resolve(process.env.GOOGLE_CREDENTIALS_FILE);
      if (!fs.existsSync(keyPath)) {
        throw new Error(`ไม่พบไฟล์กุญแจ Service Account: ${keyPath}`);
      }
      try {
        const fileContent = fs.readFileSync(keyPath, 'utf8');
        credsData = JSON.parse(fileContent);
      } catch (e) {
        throw new Error(`ไม่สามารถอ่านไฟล์กุญแจ Service Account: ${e.message}`);
      }
    } else {
      throw new Error('กรุณากำหนด GOOGLE_CREDENTIALS_FILE หรือ GOOGLE_CREDENTIALS_JSON ใน .env');
    }

    if (!this.spreadsheetId) {
      throw new Error('กรุณากำหนด SPREADSHEET_ID ใน .env');
    }

    const auth = new google.auth.JWT({
      email: credsData.client_email,
      key: credsData.private_key,
      scopes: ['https://www.googleapis.com/auth/spreadsheets']
    });
    this.sheets = google.sheets({ version: 'v4', auth });
    return this.sheets;
  }

  // จัดการข้อผิดพลาดให้อ่านเข้าใจง่าย ไม่เปิดเผย Key
  sanitizeError(err, actionDesc = 'ดำเนินการ') {
    const rawMsg = err.message || err.toString();
    console.error(`[SheetsService Error] ${actionDesc}:`, rawMsg);

    if (rawMsg.includes('The caller does not have permission') || rawMsg.includes('403')) {
      return new Error('ไม่มีสิทธิ์เข้าถึง Google Sheets กรุณาตรวจสอบว่าได้แชร์สิทธิ์ Editor ให้กับ Service Account หรือยัง');
    }
    if (rawMsg.includes('Requested entity was not found') || rawMsg.includes('404')) {
      return new Error(`ไม่พบ Google Spreadsheet (ID: ${this.spreadsheetId}) กรุณาตรวจสอบ SPREADSHEET_ID ในการตั้งค่า`);
    }
    if (rawMsg.includes('Unable to parse range')) {
      return new Error(`ไม่พบแท็บ "${this.sheetName}" ใน Google Spreadsheet กรุณาตรวจสอบชื่อชีต`);
    }
    if (rawMsg.includes('รูปแบบ GOOGLE_CREDENTIALS') || rawMsg.includes('ไม่พบไฟล์กุญแจ')) {
      return err;
    }
    return new Error(`เกิดข้อผิดพลาดในการ${actionDesc}: ${rawMsg.replace(/AIza[0-9A-Za-z-_]{35}/g, '***')}`);
  }

  // ดึง sheetId (ตัวเลขสำหรับ batchUpdate)
  async getSheetId() {
    if (this.sheetId !== null) return this.sheetId;

    try {
      const sheets = this.getSheetsClient();
      const meta = await sheets.spreadsheets.get({
        spreadsheetId: this.spreadsheetId
      });

      const target = meta.data.sheets.find(s => s.properties.title === this.sheetName);
      if (!target) {
        // หากไม่เจอชื่อแท็บที่ระบุ ใช้แท็บแรก
        if (meta.data.sheets.length > 0) {
          this.sheetId = meta.data.sheets[0].properties.sheetId;
          this.sheetName = meta.data.sheets[0].properties.title;
          return this.sheetId;
        }
        throw new Error(`ไม่พบแท็บ "${this.sheetName}" ใน Google Spreadsheet`);
      }

      this.sheetId = target.properties.sheetId;
      return this.sheetId;
    } catch (err) {
      throw this.sanitizeError(err, 'ดึงข้อมูลแท็บชีต');
    }
  }

  // ตรวจสอบและสร้างหัวคอลัมน์อัตโนมัติถ้าแถวแรกยังว่าง (Requirement 3)
  async ensureHeaders() {
    try {
      const sheets = this.getSheetsClient();
      const res = await sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: `'${this.sheetName}'!1:1`
      });

      const currentHeaders = res.data.values && res.data.values[0] ? res.data.values[0] : [];
      if (currentHeaders.length === 0 || !currentHeaders.some(h => String(h).trim() !== '')) {
        // แถวแรกยังว่าง -> บันทึก DEFAULT_HEADERS พร้อมตกแต่ง Format สวยงาม
        await sheets.spreadsheets.values.update({
          spreadsheetId: this.spreadsheetId,
          range: `'${this.sheetName}'!A1`,
          valueInputOption: 'USER_ENTERED',
          resource: {
            values: [DEFAULT_HEADERS]
          }
        });

        // จัดรูปแบบหัวตาราง (สีกรมท่า #1F3A5F ตัวอักษรสีขาว หนา ล็อกแถวแรก)
        try {
          const sheetId = await this.getSheetId();
          await sheets.spreadsheets.batchUpdate({
            spreadsheetId: this.spreadsheetId,
            resource: {
              requests: [
                {
                  repeatCell: {
                    range: {
                      sheetId: sheetId,
                      startRowIndex: 0,
                      endRowIndex: 1,
                      startColumnIndex: 0,
                      endColumnIndex: DEFAULT_HEADERS.length
                    },
                    cell: {
                      userEnteredFormat: {
                        backgroundColor: { red: 31 / 255, green: 58 / 255, blue: 95 / 255 }, // #1F3A5F
                        textFormat: {
                          foregroundColor: { red: 1, green: 1, blue: 1 },
                          bold: true,
                          fontSize: 10
                        },
                        horizontalAlignment: 'CENTER'
                      }
                    },
                    fields: 'userEnteredFormat(backgroundColor,textFormat,horizontalAlignment)'
                  }
                },
                {
                  updateSheetProperties: {
                    properties: {
                      sheetId: sheetId,
                      gridProperties: {
                        frozenRowCount: 1
                      }
                    },
                    fields: 'gridProperties.frozenRowCount'
                  }
                }
              ]
            }
          });
        } catch (formatErr) {
          console.warn('[SheetsService] Note: format header optional warning:', formatErr.message);
        }

        this.headers = DEFAULT_HEADERS;
      } else {
        this.headers = currentHeaders;
      }

      return this.headers;
    } catch (err) {
      throw this.sanitizeError(err, 'ตรวจสอบหัวคอลัมน์ใน Google Sheets');
    }
  }

  // แปลงแถวข้อมูลดิบเป็น JavaScript Object
  rowToObject(headers, row, rowIndex) {
    const obj = {
      _rowIndex: rowIndex // 1-based row index ใน Google Sheets (แถว 2, 3, ...)
    };

    // แมปตามหัวตารางที่เจอ
    headers.forEach((h, colIdx) => {
      const val = row[colIdx] !== undefined ? String(row[colIdx]) : '';
      const headerStr = String(h).trim();

      // หาความสัมพันธ์กับคีย์มาตรฐาน
      const matchedDef = COLUMN_DEFINITIONS.find(def =>
        def.header.toLowerCase() === headerStr.toLowerCase() ||
        def.aliases.some(a => a.toLowerCase() === headerStr.toLowerCase())
      );

      if (matchedDef) {
        obj[matchedDef.key] = val;
      }
      obj[headerStr] = val;
    });

    // กำหนดค่า default ถ้ายังไม่มี
    if (!obj.id) obj.id = '';
    if (!obj.status) obj.status = 'รอตรวจสอบ';
    if (!obj.submittedAt && obj.timestamp) obj.submittedAt = obj.timestamp;

    return obj;
  }

  // แปลง JavaScript Object เป็น Array เพื่อเขียนลงแถวใน Google Sheets
  objectToRow(headers, applicant) {
    return headers.map(h => {
      const headerStr = String(h).trim();
      const matchedDef = COLUMN_DEFINITIONS.find(def =>
        def.header.toLowerCase() === headerStr.toLowerCase() ||
        def.aliases.some(a => a.toLowerCase() === headerStr.toLowerCase())
      );

      if (matchedDef && applicant[matchedDef.key] !== undefined && applicant[matchedDef.key] !== null) {
        return String(applicant[matchedDef.key]);
      }
      if (applicant[headerStr] !== undefined && applicant[headerStr] !== null) {
        return String(applicant[headerStr]);
      }
      return '';
    });
  }

  // 1. GET: อ่านข้อมูลผู้สมัครทั้งหมด
  async getAllApplicants() {
    try {
      const sheets = this.getSheetsClient();
      await this.ensureHeaders();

      const res = await sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: `'${this.sheetName}'!A:ZZ`
      });

      const allRows = res.data.values || [];
      if (allRows.length <= 1) {
        return [];
      }

      const headers = allRows[0];
      const applicants = [];

      for (let i = 1; i < allRows.length; i++) {
        const row = allRows[i];
        // ข้ามแถวที่ว่างเปล่าทั้งหมด
        if (!row || row.length === 0 || !row.some(cell => String(cell).trim() !== '')) {
          continue;
        }
        const applicant = this.rowToObject(headers, row, i + 1);
        applicants.push(applicant);
      }

      return applicants;
    } catch (err) {
      throw this.sanitizeError(err, 'ดึงข้อมูลผู้สมัคร');
    }
  }

  // 2. GET by ID / ApplicationNo / NationalID
  async getApplicantById(idOrAppNo) {
    const list = await this.getAllApplicants();
    const clean = String(idOrAppNo).trim();
    return list.find(a =>
      a.id === clean ||
      a.applicationNo === clean ||
      a.nationalId === clean
    ) || null;
  }

  // 3. POST: เพิ่มผู้สมัครใหม่ (Requirement 4)
  async addApplicant(data) {
    try {
      const sheets = this.getSheetsClient();
      await this.ensureHeaders();
      const currentList = await this.getAllApplicants();

      // ตรวจสอบข้อมูลซ้ำ (เลขประจำตัวประชาชน + ปีการศึกษา)
      const cleanNationalId = String(data.nationalId || '').trim();
      const academicYear = String(data.academicYear || process.env.ACADEMIC_YEAR || '2570').trim();

      const isDuplicate = currentList.some(a =>
        a.nationalId === cleanNationalId &&
        String(a.academicYear).trim() === academicYear
      );

      if (isDuplicate) {
        const err = new Error(`เลขประจำตัวประชาชน ${cleanNationalId} ได้ยื่นใบสมัครในปีการศึกษา ${academicYear} ไปแล้ว ไม่สามารถสมัครซ้ำได้`);
        err.statusCode = 409;
        throw err;
      }

      // ออกเลขที่ใบสมัครอัตโนมัติ (เช่น Q70-0001) ถ้ายังไม่มี
      let appNo = data.applicationNo;
      if (!appNo) {
        const prefix = `Q${academicYear.slice(-2)}-`;
        let maxSeq = 0;
        currentList.forEach(a => {
          if (a.applicationNo && a.applicationNo.startsWith(prefix)) {
            const num = parseInt(a.applicationNo.replace(prefix, ''), 10);
            if (!isNaN(num) && num > maxSeq) maxSeq = num;
          }
        });
        appNo = `${prefix}${String(maxSeq + 1).padStart(4, '0')}`;
      }

      // จัดเตรียมข้อมูลผู้สมัคร
      const now = new Date();
      const pad = (n) => String(n).padStart(2, '0');
      const formattedTimestamp = `${now.getFullYear() + 543}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;

      const newRecord = {
        ...data,
        id: data.id || crypto.randomUUID(), // UUID ตามข้อกำหนด
        submittedAt: data.submittedAt || formattedTimestamp, // วันที่ส่งข้อมูล
        status: data.status || 'รอตรวจสอบ', // สถานะเริ่มต้น
        applicationNo: appNo,
        academicYear: academicYear,
        nationalId: cleanNationalId,
        staffNote: data.staffNote || '',
        studentId: data.studentId || '',
        enrolledAt: data.enrolledAt || '',
        enrolledBy: data.enrolledBy || ''
      };

      const rowValues = this.objectToRow(this.headers, newRecord);

      await sheets.spreadsheets.values.append({
        spreadsheetId: this.spreadsheetId,
        range: `'${this.sheetName}'!A:A`,
        valueInputOption: 'USER_ENTERED',
        insertDataOption: 'INSERT_ROWS',
        resource: {
          values: [rowValues]
        }
      });

      return newRecord;
    } catch (err) {
      if (err.statusCode) throw err;
      throw this.sanitizeError(err, 'บันทึกข้อมูลผู้สมัครใหม่');
    }
  }

  // 4. PUT: แก้ไขข้อมูลผู้สมัครตาม id หรือ applicationNo
  async updateApplicant(idOrAppNo, updateData) {
    try {
      const sheets = this.getSheetsClient();
      await this.ensureHeaders();
      const currentList = await this.getAllApplicants();

      const clean = String(idOrAppNo).trim();
      const target = currentList.find(a => a.id === clean || a.applicationNo === clean);

      if (!target) {
        const err = new Error(`ไม่พบข้อมูลผู้สมัครที่ต้องการแก้ไข (ID: ${clean})`);
        err.statusCode = 404;
        throw err;
      }

      const rowIndex = target._rowIndex;
      const updatedRecord = {
        ...target,
        ...updateData,
        id: target.id // คง UUID เดิมไว้เสมอ
      };
      delete updatedRecord._rowIndex;

      const rowValues = this.objectToRow(this.headers, updatedRecord);

      await sheets.spreadsheets.values.update({
        spreadsheetId: this.spreadsheetId,
        range: `'${this.sheetName}'!A${rowIndex}`,
        valueInputOption: 'USER_ENTERED',
        resource: {
          values: [rowValues]
        }
      });

      return updatedRecord;
    } catch (err) {
      if (err.statusCode) throw err;
      throw this.sanitizeError(err, 'แก้ไขข้อมูลผู้สมัคร');
    }
  }

  // 5. DELETE: ลบแถวจริงด้วย batchUpdate deleteDimension (Requirement 4)
  async deleteApplicant(idOrAppNo) {
    try {
      const sheets = this.getSheetsClient();
      await this.ensureHeaders();
      const currentList = await this.getAllApplicants();

      const clean = String(idOrAppNo).trim();
      const target = currentList.find(a => a.id === clean || a.applicationNo === clean);

      if (!target) {
        const err = new Error(`ไม่พบข้อมูลผู้สมัครที่ต้องการลบ (ID: ${clean})`);
        err.statusCode = 404;
        throw err;
      }

      const rowIndex = target._rowIndex; // 1-based row index ใน Sheet เช่น แถว 2
      const sheetId = await this.getSheetId();

      // deleteDimension ใช้ startIndex เป็น 0-based inclusive และ endIndex เป็น exclusive
      // แถวที่ 2 ใน Sheet จะมี startIndex = 1, endIndex = 2
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId: this.spreadsheetId,
        resource: {
          requests: [
            {
              deleteDimension: {
                range: {
                  sheetId: sheetId,
                  dimension: 'ROWS',
                  startIndex: rowIndex - 1,
                  endIndex: rowIndex
                }
              }
            }
          ]
        }
      });

      return {
        success: true,
        message: `ลบข้อมูลผู้สมัคร ${target.applicationNo || target.fullName || clean} สำเร็จ`,
        deletedId: target.id,
        applicationNo: target.applicationNo
      };
    } catch (err) {
      if (err.statusCode) throw err;
      throw this.sanitizeError(err, 'ลบข้อมูลผู้สมัคร');
    }
  }
}

module.exports = new SheetsService();
