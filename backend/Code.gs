/**
 * ============================================================================
 * ระบบรับสมัครเรียนออนไลน์ (โควตา) วิทยาลัยเทคนิคท่าหลวงซิเมนต์ไทยอนุสรณ์
 * ประจำปีการศึกษา 2570
 * สังกัดสำนักงานคณะกรรมการการอาชีวศึกษา (สอศ.)
 * 
 * Google Apps Script Backend (API, Database, Drive & Notifications)
 * ============================================================================
 */

// ชื่อชีตมาตรฐานในฐานข้อมูล Google Sheets
const SHEET_APPLICANTS = 'Applicants';
const SHEET_DOCUMENTS  = 'Documents';
const SHEET_STATUS_LOG = 'StatusLog';
const SHEET_STAFF      = 'Staff';
const SHEET_SETTINGS   = 'Settings';

/**
 * ฟังก์ชันหลักรับคำขอ HTTP GET (API Read)
 */
function doGet(e) {
  try {
    const params = e ? e.parameter : {};
    const action = params.action || 'getSettings';

    let result = {};

    switch (action) {
      case 'getSettings':
        result = handleGetSettings();
        break;

      case 'checkStatus':
        result = handleCheckStatus(params.nationalId);
        break;

      case 'getApplicants':
        result = handleGetApplicants(params);
        break;

      case 'getApplicantDetail':
        result = handleGetApplicantDetail(params.applicationNo);
        break;

      case 'getDashboardStats':
        result = handleGetDashboardStats();
        break;

      case 'exportData':
        result = handleExportData(params);
        break;

      default:
        result = { success: false, message: 'ไม่พบคำสั่งที่ระบุ (Invalid action)' };
    }

    return createJsonResponse(result);
  } catch (error) {
    return createJsonResponse({
      success: false,
      message: 'เกิดข้อผิดพลาดในการประมวลผล: ' + error.toString()
    });
  }
}

/**
 * ฟังก์ชันหลักรับคำขอ HTTP POST (API Write / Upload / Auth)
 */
function doPost(e) {
  try {
    let payload = {};
    if (e && e.postData && e.postData.contents) {
      payload = JSON.parse(e.postData.contents);
    } else if (e && e.parameter) {
      payload = e.parameter;
    }

    const action = payload.action;
    let result = {};

    switch (action) {
      case 'submitApplication':
        result = handleSubmitApplication(payload.data);
        break;

      case 'reuploadDocument':
        result = handleReuploadDocument(payload.data);
        break;

      case 'staffLogin':
        result = handleStaffLogin(payload.username, payload.password);
        break;

      case 'updateStatus':
        result = handleUpdateStatus(payload.data, payload.staffUser);
        break;

      case 'enrollStudent':
        result = handleEnrollStudent(payload.data, payload.staffUser);
        break;

      case 'saveSettings':
        result = handleSaveSettings(payload.settings, payload.staffUser);
        break;

      case 'initSystem':
        result = setupSystem();
        break;

      default:
        result = { success: false, message: 'ไม่พบคำสั่ง POST ที่ระบุ' };
    }

    return createJsonResponse(result);
  } catch (error) {
    return createJsonResponse({
      success: false,
      message: 'เกิดข้อผิดพลาดในการประมวลผล: ' + error.toString()
    });
  }
}

/**
 * ส่งคืนข้อมูลแบบ JSON พร้อมกำหนด CORS Header
 */
function createJsonResponse(data) {
  const output = ContentService.createTextOutput(JSON.stringify(data));
  output.setMimeType(ContentService.MimeType.JSON);
  return output;
}

// ============================================================================
// ฟังก์ชันจัดการข้อมูล (Handlers)
// ============================================================================

/**
 * ดึงการตั้งค่าระบบและรายชื่อสาขาวิชาจากชีต Settings
 */
function handleGetSettings() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const settingsSheet = ss.getSheetByName(SHEET_SETTINGS);
  
  if (!settingsSheet) {
    setupSystem();
  }

  const rawSettings = getSettingsMap();

  return {
    success: true,
    data: {
      systemOpen: rawSettings['system_open'] === 'true',
      academicYear: rawSettings['academic_year'] || '2570',
      startDate: rawSettings['start_date'] || '2026-11-01',
      endDate: rawSettings['end_date'] || '2027-01-15',
      announcementTitle: rawSettings['announcement_title'] || 'ประกาศรับสมัครคัดเลือกเข้าศึกษาต่อ (โควตา) วิทยาลัยเทคนิคท่าหลวงซิเมนต์ไทยอนุสรณ์',
      announcementBody: rawSettings['announcement_body'] || '',
      programsPvc: JSON.parse(rawSettings['programs_pvc'] || '[]'),
      programsPvs: JSON.parse(rawSettings['programs_pvs'] || '[]')
    }
  };
}

/**
 * ตรวจสอบสถานะการสมัครด้วยเลขประจำตัวประชาชน 13 หลัก
 */
function handleCheckStatus(nationalId) {
  if (!nationalId || nationalId.trim().length !== 13) {
    return { success: false, message: 'กรุณาระบุเลขประจำตัวประชาชน 13 หลักให้ถูกต้อง' };
  }

  const cleanId = nationalId.trim();
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const appSheet = ss.getSheetByName(SHEET_APPLICANTS);
  if (!appSheet) return { success: false, message: 'ยังไม่มีฐานข้อมูลผู้สมัคร' };

  const data = appSheet.getDataRange().getValues();
  if (data.length <= 1) {
    return { success: false, message: 'ไม่พบข้อมูลการสมัครของเลขประจำตัวประชาชนนี้' };
  }

  const headers = data[0];
  const colIndex = {
    appNo: headers.indexOf('ApplicationNo'),
    nationalId: headers.indexOf('NationalID'),
    title: headers.indexOf('Title'),
    fullName: headers.indexOf('FullName'),
    level: headers.indexOf('Level'),
    branch1: headers.indexOf('BranchOrder1'),
    branch2: headers.indexOf('BranchOrder2'),
    status: headers.indexOf('Status'),
    note: headers.indexOf('StaffNote'),
    studentId: headers.indexOf('StudentID'),
    timestamp: headers.indexOf('Timestamp')
  };

  let matchedApplicant = null;
  // ค้นหาแถวล่าสุดของผู้สมัครนี้
  for (let i = data.length - 1; i >= 1; i--) {
    const row = data[i];
    if (String(row[colIndex.nationalId]).trim() === cleanId) {
      matchedApplicant = row;
      break;
    }
  }

  if (!matchedApplicant) {
    return { success: false, message: 'ไม่พบข้อมูลการสมัครในระบบ' };
  }

  const appNo = matchedApplicant[colIndex.appNo];

  // ดึงรายการเอกสารแนบของผู้สมัครนี้
  const docs = getDocumentsByAppNo(appNo);

  return {
    success: true,
    data: {
      applicationNo: appNo,
      title: matchedApplicant[colIndex.title],
      fullName: matchedApplicant[colIndex.fullName],
      level: matchedApplicant[colIndex.level],
      branchOrder1: matchedApplicant[colIndex.branch1],
      branchOrder2: matchedApplicant[colIndex.branch2] || '',
      status: matchedApplicant[colIndex.status] || 'รอตรวจสอบ',
      staffNote: matchedApplicant[colIndex.note] || '',
      studentId: matchedApplicant[colIndex.studentId] || '',
      timestamp: matchedApplicant[colIndex.timestamp],
      documents: docs
    }
  };
}

/**
 * ยื่นใบสมัครใหม่ (Submit Application)
 */
function handleSubmitApplication(formData) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const appSheet = ss.getSheetByName(SHEET_APPLICANTS);
  const settings = getSettingsMap();

  // ตรวจสอบว่าระบบเปิดรับสมัครอยู่หรือไม่
  if (settings['system_open'] === 'false') {
    return { success: false, message: 'ขณะนี้ระบบรับสมัครปิดให้บริการตามกำหนดการ' };
  }

  // ตรวจสอบเลขประจำตัวประชาชนซ้ำในปีการศึกษาเดียวกัน
  const cleanId = String(formData.nationalId).trim();
  const academicYear = settings['academic_year'] || '2570';
  
  if (isDuplicateNationalId(appSheet, cleanId, academicYear)) {
    return {
      success: false,
      message: 'เลขประจำตัวประชาชนนี้ได้ทำการยื่นใบสมัครในปีการศึกษา ' + academicYear + ' ไปแล้ว ไม่สามารถสมัครซ้ำได้'
    };
  }

  // สร้างเลขที่ใบสมัครอัตโนมัติ เช่น Q70-0001
  const applicationNo = generateApplicationNo(appSheet, academicYear);
  const now = new Date();

  // จัดการอัปโหลดไฟล์ไปยัง Google Drive
  const folderId = settings['drive_folder_id'] || getOrCreateDriveFolder().getId();
  const uploadedDocs = saveFilesToDrive(folderId, applicationNo, formData.files || []);

  // บันทึกแถวข้อมูลผู้สมัครลงใน Applicants
  const rowData = [
    applicationNo,
    Utilities.formatDate(now, 'Asia/Bangkok', 'yyyy-MM-dd HH:mm:ss'),
    academicYear,
    formData.level,
    formData.title,
    formData.fullName,
    formData.birthDate,
    "'" + cleanId,
    formData.fatherName || '',
    formData.fatherAge || '',
    formData.fatherJob || '',
    formData.motherName || '',
    formData.motherAge || '',
    formData.motherJob || '',
    formData.addressHouseNo || '',
    formData.addressMoo || '',
    formData.addressSoi || '',
    formData.addressRoad || '',
    formData.addressSubdistrict || '',
    formData.addressDistrict || '',
    formData.addressProvince || '',
    formData.addressPostalCode || '',
    "'" + (formData.phone || ''),
    formData.currentLevel || '',
    formData.schoolName || '',
    formData.schoolLocation || '',
    formData.gpax || '',
    formData.oldMajor || '',
    formData.branchOrder1 || '',
    formData.branchOrder2 || '',
    'รอตรวจสอบ',
    '',
    '',
    '',
    ''
  ];

  appSheet.appendRow(rowData);

  // บันทึกประวัติเริ่มต้นลง StatusLog
  logStatusChange(applicationNo, '', 'รอตรวจสอบ', 'ผู้สมัครยื่นใบสมัครผ่านระบบออนไลน์', 'System');

  // แจ้งเตือนไปยัง LINE หรืออีเมลเจ้าหน้าที่
  sendNewApplicantNotification(applicationNo, formData);

  return {
    success: true,
    message: 'บันทึกข้อมูลการสมัครเรียบร้อยแล้ว',
    applicationNo: applicationNo,
    academicYear: academicYear,
    timestamp: Utilities.formatDate(now, 'Asia/Bangkok', 'dd/MM/yyyy HH:mm:ss')
  };
}

/**
 * ผู้สมัครอัปโหลดเอกสารใหม่กรณีสถานะเป็นเอกสารไม่ครบ
 */
function handleReuploadDocument(payload) {
  const { applicationNo, docType, fileData } = payload;
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const settings = getSettingsMap();
  const folderId = settings['drive_folder_id'] || getOrCreateDriveFolder().getId();

  const folder = DriveApp.getFolderById(folderId);
  const contentType = fileData.type || 'application/octet-stream';
  const decoded = Utilities.base64Decode(fileData.base64.split(',')[1] || fileData.base64);
  const blob = Utilities.newBlob(decoded, contentType, applicationNo + '_' + docType + '_' + fileData.name);
  const file = folder.createFile(blob);
  file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

  const docSheet = ss.getSheetByName(SHEET_DOCUMENTS);
  const docId = 'DOC-' + Utilities.formatDate(new Date(), 'Asia/Bangkok', 'yyyyMMddHHmmss');
  
  docSheet.appendRow([
    docId,
    applicationNo,
    docType,
    fileData.name,
    file.getId(),
    file.getUrl(),
    file.getDownloadUrl(),
    Utilities.formatDate(new Date(), 'Asia/Bangkok', 'yyyy-MM-dd HH:mm:ss'),
    'REUPLOADED'
  ]);

  // ปรับสถานะใบสมัครกลับเป็น "รอตรวจสอบ"
  updateApplicantStatusOnly(applicationNo, 'รอตรวจสอบ', 'ผู้สมัครอัปโหลดเอกสารแก้ไขเพิ่มเติม');
  logStatusChange(applicationNo, 'เอกสารไม่ครบ', 'รอตรวจสอบ', 'ผู้สมัครอัปโหลดเอกสารแก้ไขเพิ่มเติม (' + docType + ')', 'Applicant');

  return {
    success: true,
    message: 'อัปโหลดเอกสารแก้ไขเรียบร้อยแล้ว เจ้าหน้าที่จะดำเนินการตรวจสอบอีกครั้ง'
  };
}

/**
 * ล็อกอินเจ้าหน้าที่ (Authentication)
 */
function handleStaffLogin(username, password) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const staffSheet = ss.getSheetByName(SHEET_STAFF);
  if (!staffSheet) {
    setupSystem();
  }

  const data = staffSheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const u = String(row[1]).trim();
    const p = String(row[2]).trim();
    const name = row[3];
    const role = row[4];
    const active = row[5];

    if (u === username.trim() && p === password.trim()) {
      if (active === false || active === 'FALSE') {
        return { success: false, message: 'บัญชีผู้ใช้นี้ถูกระงับการใช้งาน กรุณาติดต่อผู้ดูแลระบบ' };
      }
      return {
        success: true,
        message: 'เข้าสู่ระบบสำเร็จ',
        token: Utilities.base64Encode(username + ':' + new Date().getTime()),
        user: {
          username: u,
          fullName: name,
          role: role
        }
      };
    }
  }

  return { success: false, message: 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง' };
}

/**
 * ดึงรายการผู้สมัครสำหรับเจ้าหน้าที่
 */
function handleGetApplicants(params) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const appSheet = ss.getSheetByName(SHEET_APPLICANTS);
  if (!appSheet) return { success: true, data: [] };

  const data = appSheet.getDataRange().getValues();
  if (data.length <= 1) return { success: true, data: [] };

  const headers = data[0];
  const list = [];

  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const item = {};
    headers.forEach((h, idx) => {
      item[h] = row[idx];
    });
    list.push(item);
  }

  return { success: true, data: list };
}

/**
 * เปลี่ยนสถานะผู้สมัคร พร้อมบันทึกประวัติและแจ้งเตือน
 */
function handleUpdateStatus(data, staffUser) {
  const { applicationNo, newStatus, staffNote } = data;
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const appSheet = ss.getSheetByName(SHEET_APPLICANTS);
  const rows = appSheet.getDataRange().getValues();
  const headers = rows[0];

  const appNoIdx = headers.indexOf('ApplicationNo');
  const statusIdx = headers.indexOf('Status');
  const noteIdx = headers.indexOf('StaffNote');

  let oldStatus = '';
  let foundRow = -1;

  for (let i = 1; i < rows.length; i++) {
    if (rows[i][appNoIdx] === applicationNo) {
      oldStatus = rows[i][statusIdx];
      foundRow = i + 1;
      break;
    }
  }

  if (foundRow === -1) {
    return { success: false, message: 'ไม่พบใบสมัครรหัส ' + applicationNo };
  }

  appSheet.getRange(foundRow, statusIdx + 1).setValue(newStatus);
  appSheet.getRange(foundRow, noteIdx + 1).setValue(staffNote || '');

  // บันทึกประวัติ
  const operator = (staffUser && staffUser.fullName) ? staffUser.fullName : 'เจ้าหน้าที่';
  logStatusChange(applicationNo, oldStatus, newStatus, staffNote || '', operator);

  // ส่งแจ้งเตือนถ้าผ่านการคัดเลือกหรือเอกสารไม่ครบ
  sendStatusUpdateNotification(applicationNo, newStatus, staffNote);

  return { success: true, message: 'บันทึกการเปลี่ยนสถานะเรียบร้อยแล้ว' };
}

/**
 * บันทึกการมอบตัวและออกรหัสนักศึกษา
 */
function handleEnrollStudent(data, staffUser) {
  const { applicationNo, enrolledNotes } = data;
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const appSheet = ss.getSheetByName(SHEET_APPLICANTS);
  const rows = appSheet.getDataRange().getValues();
  const headers = rows[0];

  const appNoIdx = headers.indexOf('ApplicationNo');
  const statusIdx = headers.indexOf('Status');
  const noteIdx = headers.indexOf('StaffNote');
  const studentIdIdx = headers.indexOf('StudentID');
  const enrollDateIdx = headers.indexOf('EnrolledAt');
  const enrollByIdx = headers.indexOf('EnrolledBy');

  let targetRow = -1;
  let applicant = null;

  for (let i = 1; i < rows.length; i++) {
    if (rows[i][appNoIdx] === applicationNo) {
      targetRow = i + 1;
      applicant = rows[i];
      break;
    }
  }

  if (targetRow === -1) {
    return { success: false, message: 'ไม่พบใบสมัคร' };
  }

  // ออกรหัสนักศึกษา เช่น 70 + รหัสระดับ + เลขวิ่ง 4 หลัก เช่น 70201010001
  const studentId = generateStudentId(appSheet);
  const nowStr = Utilities.formatDate(new Date(), 'Asia/Bangkok', 'dd/MM/yyyy HH:mm:ss');
  const operator = (staffUser && staffUser.fullName) ? staffUser.fullName : 'เจ้าหน้าที่ทะเบียน';

  appSheet.getRange(targetRow, statusIdx + 1).setValue('มอบตัวแล้ว');
  appSheet.getRange(targetRow, studentIdIdx + 1).setValue("'" + studentId);
  appSheet.getRange(targetRow, enrollDateIdx + 1).setValue(nowStr);
  appSheet.getRange(targetRow, enrollByIdx + 1).setValue(operator);
  if (enrolledNotes) {
    appSheet.getRange(targetRow, noteIdx + 1).setValue(enrolledNotes);
  }

  logStatusChange(applicationNo, applicant[statusIdx], 'มอบตัวแล้ว', 'บันทึกมอบตัว ออกรหัสนักศึกษา: ' + studentId, operator);

  return {
    success: true,
    message: 'บันทึกการมอบตัวสำเร็จ',
    studentId: studentId
  };
}

/**
 * บันทึกการตั้งค่าระบบ
 */
function handleSaveSettings(newSettings, staffUser) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_SETTINGS);
  if (!sheet) return { success: false, message: 'ไม่พบชีตการตั้งค่า' };

  const data = sheet.getDataRange().getValues();
  const map = {};

  for (let key in newSettings) {
    let found = false;
    let val = newSettings[key];
    if (typeof val === 'object') {
      val = JSON.stringify(val);
    }
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === key) {
        sheet.getRange(i + 1, 2).setValue(String(val));
        found = true;
        break;
      }
    }
    if (!found) {
      sheet.appendRow([key, String(val), '']);
    }
  }

  return { success: true, message: 'บันทึกการตั้งค่าเรียบร้อยแล้ว' };
}

// ============================================================================
// ฟังก์ชันตัวช่วย (Utility & Helpers)
// ============================================================================

/**
 * ตรวจสอบเลขประจำตัวประชาชนซ้ำในปีการศึกษาเดียวกัน
 */
function isDuplicateNationalId(sheet, nationalId, academicYear) {
  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return false;

  const idIdx = data[0].indexOf('NationalID');
  const yearIdx = data[0].indexOf('AcademicYear');

  for (let i = 1; i < data.length; i++) {
    const rowId = String(data[i][idIdx]).replace(/'/g, '').trim();
    const rowYear = String(data[i][yearIdx]).trim();
    if (rowId === nationalId && rowYear === academicYear) {
      return true;
    }
  }
  return false;
}

/**
 * ออกรหัสใบสมัครอัตโนมัติ เช่น Q70-0001
 */
function generateApplicationNo(sheet, academicYear) {
  const prefix = 'Q' + (String(academicYear).slice(-2)) + '-';
  const data = sheet.getDataRange().getValues();
  let maxSeq = 0;

  if (data.length > 1) {
    const appNoIdx = data[0].indexOf('ApplicationNo');
    for (let i = 1; i < data.length; i++) {
      const val = String(data[i][appNoIdx]).trim();
      if (val.startsWith(prefix)) {
        const numPart = parseInt(val.replace(prefix, ''), 10);
        if (!isNaN(numPart) && numPart > maxSeq) {
          maxSeq = numPart;
        }
      }
    }
  }

  const nextSeq = maxSeq + 1;
  return prefix + ('0000' + nextSeq).slice(-4);
}

/**
 * ออกรหัสนักศึกษาอัตโนมัติสำหรับการมอบตัว
 */
function generateStudentId(sheet) {
  const yearPrefix = '7020'; // ประจำปี 2570 กลุ่มอาชีวศึกษา
  const data = sheet.getDataRange().getValues();
  let maxSeq = 0;

  if (data.length > 1) {
    const sIdIdx = data[0].indexOf('StudentID');
    for (let i = 1; i < data.length; i++) {
      const val = String(data[i][sIdIdx]).replace(/'/g, '').trim();
      if (val.startsWith(yearPrefix)) {
        const numPart = parseInt(val.slice(yearPrefix.length), 10);
        if (!isNaN(numPart) && numPart > maxSeq) {
          maxSeq = numPart;
        }
      }
    }
  }

  const nextSeq = maxSeq + 1;
  return yearPrefix + ('00000' + nextSeq).slice(-5);
}

/**
 * บันทึกไฟล์แนบลงใน Google Drive
 */
function saveFilesToDrive(folderId, applicationNo, files) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const docSheet = ss.getSheetByName(SHEET_DOCUMENTS);
  const folder = DriveApp.getFolderById(folderId);
  const savedList = [];

  files.forEach(fileObj => {
    if (!fileObj.base64) return;
    try {
      const base64Data = fileObj.base64.indexOf(',') > -1 ? fileObj.base64.split(',')[1] : fileObj.base64;
      const decoded = Utilities.base64Decode(base64Data);
      const mimeType = fileObj.type || 'application/octet-stream';
      const cleanFileName = applicationNo + '_' + fileObj.docType + '_' + fileObj.name;
      const blob = Utilities.newBlob(decoded, mimeType, cleanFileName);
      const file = folder.createFile(blob);
      file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

      const docId = 'DOC-' + Utilities.formatDate(new Date(), 'Asia/Bangkok', 'yyyyMMddHHmmss') + '-' + Math.floor(Math.random()*1000);
      const nowStr = Utilities.formatDate(new Date(), 'Asia/Bangkok', 'yyyy-MM-dd HH:mm:ss');

      docSheet.appendRow([
        docId,
        applicationNo,
        fileObj.docType,
        fileObj.name,
        file.getId(),
        file.getUrl(),
        file.getDownloadUrl(),
        nowStr,
        'VALID'
      ]);

      savedList.push({
        docType: fileObj.docType,
        fileName: fileObj.name,
        fileUrl: file.getUrl()
      });
    } catch (e) {
      Logger.log('Error saving file: ' + e.toString());
    }
  });

  return savedList;
}

/**
 * ดึงไฟล์เอกสารตามรหัสใบสมัคร
 */
function getDocumentsByAppNo(applicationNo) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const docSheet = ss.getSheetByName(SHEET_DOCUMENTS);
  if (!docSheet) return [];

  const data = docSheet.getDataRange().getValues();
  const docs = [];
  for (let i = 1; i < data.length; i++) {
    if (data[i][1] === applicationNo) {
      docs.push({
        docId: data[i][0],
        docType: data[i][2],
        fileName: data[i][3],
        fileUrl: data[i][5],
        status: data[i][8]
      });
    }
  }
  return docs;
}

/**
 * บันทึกประวัติสถานะลงใน StatusLog
 */
function logStatusChange(applicationNo, oldStatus, newStatus, note, changedBy) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const logSheet = ss.getSheetByName(SHEET_STATUS_LOG);
  if (!logSheet) return;

  const logId = 'LOG-' + Utilities.formatDate(new Date(), 'Asia/Bangkok', 'yyyyMMddHHmmss') + '-' + Math.floor(Math.random()*1000);
  const nowStr = Utilities.formatDate(new Date(), 'Asia/Bangkok', 'yyyy-MM-dd HH:mm:ss');

  logSheet.appendRow([
    logId,
    applicationNo,
    oldStatus,
    newStatus,
    note || '',
    changedBy || 'System',
    nowStr
  ]);
}

/**
 * ปรับปรุงสถานะใบสมัครอย่างเดียว
 */
function updateApplicantStatusOnly(applicationNo, newStatus, note) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_APPLICANTS);
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const appNoIdx = headers.indexOf('ApplicationNo');
  const statusIdx = headers.indexOf('Status');
  const noteIdx = headers.indexOf('StaffNote');

  for (let i = 1; i < data.length; i++) {
    if (data[i][appNoIdx] === applicationNo) {
      sheet.getRange(i + 1, statusIdx + 1).setValue(newStatus);
      if (note) sheet.getRange(i + 1, noteIdx + 1).setValue(note);
      break;
    }
  }
}

/**
 * ดึงค่าการตั้งค่าจากชีต Settings ในรูป Key-Value Map
 */
function getSettingsMap() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_SETTINGS);
  const map = {};
  if (!sheet) return map;

  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    const key = String(data[i][0]).trim();
    if (key) {
      map[key] = String(data[i][1]).trim();
    }
  }
  return map;
}

/**
 * ค้นหาหรือสร้างโฟลเดอร์ Google Drive สำหรับเก็บไฟล์เอกสาร
 */
function getOrCreateDriveFolder() {
  const folderName = 'TC_Thaluang_Quota_2570_Uploads';
  const folders = DriveApp.getFoldersByName(folderName);
  if (folders.hasNext()) {
    return folders.next();
  }
  const folder = DriveApp.createFolder(folderName);
  folder.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  return folder;
}

/**
 * ส่งแจ้งเตือนเมื่อมีผู้สมัครรายใหม่
 */
function sendNewApplicantNotification(applicationNo, formData) {
  const settings = getSettingsMap();
  const lineToken = settings['line_token'];

  if (lineToken) {
    const msg = '\n🔔 มีผู้สมัครโควตาใหม่ 2570\n' +
                'เลขที่: ' + applicationNo + '\n' +
                'ชื่อ-สกุล: ' + formData.title + formData.fullName + '\n' +
                'ระดับ: ' + formData.level + '\n' +
                'สาขา: ' + formData.branchOrder1 + '\n' +
                'โรงเรียนเดิม: ' + (formData.schoolName || '-') + '\n' +
                'เกรดสะสม: ' + (formData.gpax || '-');
    sendLineNotify(lineToken, msg);
  }
}

/**
 * ส่งแจ้งเตือนเมื่อสถานะผู้สมัครเปลี่ยนแปลง
 */
function sendStatusUpdateNotification(applicationNo, status, note) {
  const settings = getSettingsMap();
  const lineToken = settings['line_token'];

  if (lineToken) {
    const msg = '\n📌 อัปเดตสถานะใบสมัคร\n' +
                'เลขที่: ' + applicationNo + '\n' +
                'สถานะใหม่: ' + status + '\n' +
                'หมายเหตุ: ' + (note || '-');
    sendLineNotify(lineToken, msg);
  }
}

/**
 * ฟังก์ชันส่ง LINE Notify
 */
function sendLineNotify(token, message) {
  try {
    const options = {
      method: 'post',
      headers: {
        'Authorization': 'Bearer ' + token
      },
      payload: {
        'message': message
      },
      muteHttpExceptions: true
    };
    UrlFetchApp.fetch('https://notify-api.line.me/api/notify', options);
  } catch (e) {
    Logger.log('Line notify error: ' + e.toString());
  }
}

// ============================================================================
// ฟังก์ชันติดตั้งระบบอัตโนมัติ (1-Click System Setup)
// ============================================================================

/**
 * รันฟังก์ชันนี้ครั้งแรกเพื่อสร้างตารางทั้งหมดใน Google Sheets พร้อมฟอร์แมตทางการ
 */
function setupSystem() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  // 1. ชีต Applicants
  let appSheet = ss.getSheetByName(SHEET_APPLICANTS);
  if (!appSheet) {
    appSheet = ss.insertSheet(SHEET_APPLICANTS);
  }
  const appHeaders = [
    'ApplicationNo', 'Timestamp', 'AcademicYear', 'Level', 'Title', 'FullName',
    'BirthDate', 'NationalID', 'FatherName', 'FatherAge', 'FatherJob',
    'MotherName', 'MotherAge', 'MotherJob', 'AddressHouseNo', 'AddressMoo',
    'AddressSoi', 'AddressRoad', 'AddressSubdistrict', 'AddressDistrict',
    'AddressProvince', 'AddressPostalCode', 'Phone', 'CurrentLevel',
    'SchoolName', 'SchoolLocation', 'GPAX', 'OldMajor', 'BranchOrder1',
    'BranchOrder2', 'Status', 'StaffNote', 'StudentID', 'EnrolledAt', 'EnrolledBy'
  ];
  setupHeaderFormat(appSheet, appHeaders);

  // 2. ชีต Documents
  let docSheet = ss.getSheetByName(SHEET_DOCUMENTS);
  if (!docSheet) {
    docSheet = ss.insertSheet(SHEET_DOCUMENTS);
  }
  const docHeaders = [
    'DocumentID', 'ApplicationNo', 'DocType', 'DocName', 'DriveFileID',
    'DriveViewUrl', 'DriveDownloadUrl', 'UploadedAt', 'Status'
  ];
  setupHeaderFormat(docSheet, docHeaders);

  // 3. ชีต StatusLog
  let logSheet = ss.getSheetByName(SHEET_STATUS_LOG);
  if (!logSheet) {
    logSheet = ss.insertSheet(SHEET_STATUS_LOG);
  }
  const logHeaders = [
    'LogID', 'ApplicationNo', 'OldStatus', 'NewStatus', 'Note', 'ChangedBy', 'Timestamp'
  ];
  setupHeaderFormat(logSheet, logHeaders);

  // 4. ชีต Staff
  let staffSheet = ss.getSheetByName(SHEET_STAFF);
  if (!staffSheet) {
    staffSheet = ss.insertSheet(SHEET_STAFF);
  }
  const staffHeaders = [
    'StaffID', 'Username', 'Password', 'FullName', 'Role', 'Active', 'CreatedAt'
  ];
  setupHeaderFormat(staffSheet, staffHeaders);

  // เพิ่มบัญชีเจ้าหน้าที่ตั้งต้นถ้ายังไม่มี
  if (staffSheet.getLastRow() <= 1) {
    staffSheet.appendRow(['STAFF001', 'admin', 'admin2570', 'ผู้ดูแลระบบงานรับสมัคร', 'ผู้ดูแลระบบ', true, new Date()]);
    staffSheet.appendRow(['STAFF002', 'registrar', 'reg2570', 'เจ้าหน้าที่งานทะเบียนและประมวลผล', 'เจ้าหน้าที่ทะเบียน', true, new Date()]);
  }

  // 5. ชีต Settings
  let settingsSheet = ss.getSheetByName(SHEET_SETTINGS);
  if (!settingsSheet) {
    settingsSheet = ss.insertSheet(SHEET_SETTINGS);
  }
  const settingsHeaders = ['ConfigKey', 'ConfigValue', 'Description'];
  setupHeaderFormat(settingsSheet, settingsHeaders);

  // สร้างโฟลเดอร์ Drive สำหรับไฟล์แนบ
  const driveFolder = getOrCreateDriveFolder();

  // รายการสาขาวิชาตามที่กำหนด (Settings)
  const defaultPvcPrograms = [
    "เทคโนโลยีสารสนเทศ",
    "การบัญชี",
    "เทคโนโลยีธุรกิจดิจิทัล",
    "การตลาด",
    "ไฟฟ้ากำลัง",
    "อิเล็กทรอนิกส์",
    "เทคนิคคอมพิวเตอร์",
    "เทคนิคการผลิต",
    "ซ่อมบำรุงอุตสาหกรรม",
    "ยานยนต์",
    "เมคคาทรอนิกส์"
  ];

  const defaultPvsPrograms = [
    "เทคโนโลยีสารสนเทศ",
    "การบัญชี",
    "เทคโนโลยีธุรกิจดิจิทัล",
    "การตลาด",
    "ไฟฟ้ากำลัง",
    "อิเล็กทรอนิกส์",
    "เทคโนโลยีคอมพิวเตอร์",
    "เทคนิคการผลิต",
    "ซ่อมบำรุงอุตสาหกรรม",
    "ยานยนต์",
    "เมคคาทรอนิกส์"
  ];

  if (settingsSheet.getLastRow() <= 1) {
    const defaultConfigs = [
      ['system_open', 'true', 'สถานะเปิด-ปิดรับสมัคร (true=เปิด, false=ปิด)'],
      ['academic_year', '2570', 'ปีการศึกษาที่เปิดรับสมัคร'],
      ['start_date', '2026-11-01', 'วันเริ่มต้นรับสมัคร'],
      ['end_date', '2027-01-15', 'วันสิ้นสุดรับสมัคร'],
      ['announcement_title', 'ประกาศรับสมัครคัดเลือกเข้าศึกษาต่อ (โควตา) วิทยาลัยเทคนิคท่าหลวงซิเมนต์ไทยอนุสรณ์ ประจำปีการศึกษา 2570', 'หัวข้อประกาศหน้าแรก'],
      ['announcement_body', 'วิทยาลัยเทคนิคท่าหลวงซิเมนต์ไทยอนุสรณ์ มีความประสงค์เปิดรับสมัครคัดเลือกนักเรียน นักศึกษา เข้าศึกษาต่อระดับ ปวช. และ ปวส. ประเภทโควตา ประจำปีการศึกษา 2570 ขอให้ผู้สมัครตรวจสอบคุณสมบัติและเอกสารให้ครบถ้วนก่อนยื่นใบสมัคร', 'รายละเอียดประกาศ'],
      ['programs_pvc', JSON.stringify(defaultPvcPrograms), 'รายชื่อสาขาวิชา ระดับ ปวช.'],
      ['programs_pvs', JSON.stringify(defaultPvsPrograms), 'รายชื่อสาขาวิชา ระดับ ปวส.'],
      ['drive_folder_id', driveFolder.getId(), 'ID โฟลเดอร์ Google Drive เก็บไฟล์แนบ'],
      ['line_token', '', 'LINE Notify Token สำหรับแจ้งเตือนเจ้าหน้าที่'],
      ['notify_email', 'admission@thaluang.ac.th', 'อีเมลเจ้าหน้าที่รับสมัคร']
    ];

    defaultConfigs.forEach(row => settingsSheet.appendRow(row));
  }

  // ลบ Sheet1 ตั้งต้นถ้ามี
  const defaultSheet = ss.getSheetByName('Sheet1');
  if (defaultSheet && ss.getSheets().length > 1) {
    try { ss.deleteSheet(defaultSheet); } catch(e) {}
  }

  return {
    success: true,
    message: 'ติดตั้งและสร้างโครงสร้างฐานข้อมูล Google Sheets ครบ 5 ชีตสำเร็จเรียบร้อยแล้ว'
  };
}

/**
 * ปรับรูปแบบส่วนหัวตารางให้เป็นทางการ (พื้นหลังสีกรมท่า #1F3A5F ตัวอักษรสีขาว)
 */
function setupHeaderFormat(sheet, headers) {
  sheet.clear();
  sheet.appendRow(headers);
  const headerRange = sheet.getRange(1, 1, 1, headers.length);
  headerRange.setBackground('#1F3A5F');
  headerRange.setFontColor('#FFFFFF');
  headerRange.setFontWeight('bold');
  headerRange.setHorizontalAlignment('center');
  headerRange.setFontFamily('Sarabun');
  headerRange.setFontSize(10);
  sheet.setFrozenRows(1);
}
