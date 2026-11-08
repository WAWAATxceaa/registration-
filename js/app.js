/**
 * ============================================================================
 * ระบบรับสมัครเรียนออนไลน์ (โควตา) วิทยาลัยเทคนิคท่าหลวงซิเมนต์ไทยอนุสรณ์
 * ประจำปีการศึกษา 2570
 * สังกัดสำนักงานคณะกรรมการการอาชีวศึกษา (สอศ.)
 * 
 * แอปพลิเคชันสคริปต์หลัก (Frontend Logic, Validation, Storage & UI)
 * ============================================================================
 */

// ค่าคงที่และคอนฟิกเริ่มต้น
const DEFAULT_CONFIG = {
  // ใส่ Google Apps Script Web App URL ที่นี่หลังจากทำการ Deploy
  gasApiUrl: '', 
  academicYear: '2570',
  systemOpen: true,
  startDate: '2026-11-01',
  endDate: '2027-01-15',
  announcementTitle: 'ประกาศรับสมัครคัดเลือกเข้าศึกษาต่อ (ประเภทโควตา) วิทยาลัยเทคนิคท่าหลวงซิเมนต์ไทยอนุสรณ์ ประจำปีการศึกษา 2570',
  announcementBody: 'วิทยาลัยเทคนิคท่าหลวงซิเมนต์ไทยอนุสรณ์ สังกัดสำนักงานคณะกรรมการการอาชีวศึกษา มีความประสงค์เปิดรับสมัครคัดเลือกนักเรียน นักศึกษา เข้าศึกษาต่อระดับประกาศนียบัตรวิชาชีพ (ปวช.) และระดับประกาศนียบัตรวิชาชีพชั้นสูง (ปวส.) ประเภทโควตา ประจำปีการศึกษา 2570 เพื่อส่งเสริมโอกาสทางการศึกษาด้านวิชาชีพ',
  programsPvc: [
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
  ],
  programsPvs: [
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
  ]
};

// คลาสจัดการการจัดเก็บข้อมูลและการเชื่อมต่อ API (Storage / API Service)
class StorageService {
  constructor() {
    this.STORAGE_KEY_CONFIG = 'tc_thaluang_config_2570';
    this.STORAGE_KEY_APPLICANTS = 'tc_thaluang_applicants_2570';
    this.STORAGE_KEY_STATUS_LOG = 'tc_thaluang_statuslog_2570';
    this.STORAGE_KEY_STAFF_SESSION = 'tc_thaluang_staff_session';

    this.initLocalStorage();
  }

  // กำหนดค่าตั้งต้นลง LocalStorage สำหรับการทำงานโหมด Standalone / Mock
  initLocalStorage() {
    if (!localStorage.getItem(this.STORAGE_KEY_CONFIG)) {
      localStorage.setItem(this.STORAGE_KEY_CONFIG, JSON.stringify(DEFAULT_CONFIG));
    }

    if (!localStorage.getItem(this.STORAGE_KEY_APPLICANTS)) {
      // ตัวอย่างข้อมูลตั้งต้น 2 รายการสำหรับทดสอบระบบ
      const sampleApplicants = [
        {
          applicationNo: "Q70-0001",
          timestamp: "2026-11-02 09:30:00",
          academicYear: "2570",
          level: "ปวช.",
          title: "นาย",
          fullName: "สมเกียรติ มั่นคง",
          birthDate: "15 พฤษภาคม 2554",
          nationalId: "1103702584128",
          fatherName: "นายบุญมี มั่นคง",
          fatherAge: "48",
          fatherJob: "พนักงานบริษัท",
          motherName: "นางสมศรี มั่นคง",
          motherAge: "45",
          motherJob: "ค้าขาย",
          addressHouseNo: "45/2",
          addressMoo: "3",
          addressSoi: "-",
          addressRoad: "พหลโยธิน",
          addressSubdistrict: "บ้านแก้ง",
          addressDistrict: "เฉลิมพระเกียรติ",
          addressProvince: "สระบุรี",
          addressPostalCode: "18000",
          phone: "0891234567",
          currentLevel: "ม.3",
          schoolName: "โรงเรียนเฉลิมพระเกียรติวิทยา",
          schoolLocation: "ต.บ้านแก้ง อ.เฉลิมพระเกียรติ จ.สระบุรี",
          gpax: "3.75",
          oldMajor: "-",
          branchOrder1: "เทคโนโลยีสารสนเทศ",
          branchOrder2: "เทคนิคคอมพิวเตอร์",
          status: "ผ่านการคัดเลือก",
          staffNote: "คุณสมบัติและเอกสารถูกต้องครบถ้วน ผ่านเกณฑ์โควตาสาขาวิชา",
          studentId: "70201010001",
          enrolledAt: "2026-11-05 14:15:00",
          enrolledBy: "เจ้าหน้าที่ทะเบียน",
          files: [
            { docType: "PHOTO_1INCH", name: "photo_sample.jpg", url: "assets/logo.png" },
            { docType: "GPAX_TRANSCRIPT", name: "transcript_5semesters.pdf", url: "#" },
            { docType: "CITIZEN_ID_CARD", name: "id_card_copy.pdf", url: "#" }
          ]
        },
        {
          applicationNo: "Q70-0002",
          timestamp: "2026-11-03 11:20:00",
          academicYear: "2570",
          level: "ปวส. (สายตรง)",
          title: "นางสาว",
          fullName: "นภัสสร รุ่งเรือง",
          birthDate: "20 ตุลาคม 2551",
          nationalId: "1199900876541",
          fatherName: "นายประสิทธิ์ รุ่งเรือง",
          fatherAge: "52",
          fatherJob: "เกษตรกร",
          motherName: "นางพรทิพย์ รุ่งเรือง",
          motherAge: "50",
          motherJob: "เกษตรกร",
          addressHouseNo: "88",
          addressMoo: "5",
          addressSoi: "เทศบาล 4",
          addressRoad: "สุวรรณศร",
          addressSubdistrict: "บ้านหมอ",
          addressDistrict: "บ้านหมอ",
          addressProvince: "สระบุรี",
          addressPostalCode: "18130",
          phone: "0819876543",
          currentLevel: "ปวช.3",
          schoolName: "วิทยาลัยเทคนิคท่าหลวงซิเมนต์ไทยอนุสรณ์",
          schoolLocation: "ต.บ้านแก้ง อ.เฉลิมพระเกียรติ จ.สระบุรี",
          gpax: "3.42",
          oldMajor: "การบัญชี",
          branchOrder1: "การบัญชี",
          branchOrder2: "",
          status: "รอตรวจสอบ",
          staffNote: "รอคณะกรรมการงานทะเบียนตรวจสอบคุณสมบัติและเอกสาร",
          studentId: "",
          enrolledAt: "",
          enrolledBy: "",
          files: [
            { docType: "PHOTO_1INCH", name: "profile.jpg", url: "assets/logo.png" },
            { docType: "GPAX_TRANSCRIPT", name: "transcript.pdf", url: "#" },
            { docType: "CITIZEN_ID_CARD", name: "citizen_card.pdf", url: "#" }
          ]
        }
      ];
      localStorage.setItem(this.STORAGE_KEY_APPLICANTS, JSON.stringify(sampleApplicants));
    }

    if (!localStorage.getItem(this.STORAGE_KEY_STATUS_LOG)) {
      const sampleLogs = [
        {
          logId: "LOG-001",
          applicationNo: "Q70-0001",
          oldStatus: "",
          newStatus: "รอตรวจสอบ",
          note: "ผู้สมัครยื่นใบสมัครผ่านระบบออนไลน์",
          changedBy: "System",
          timestamp: "2026-11-02 09:30:00"
        },
        {
          logId: "LOG-002",
          applicationNo: "Q70-0001",
          oldStatus: "รอตรวจสอบ",
          newStatus: "ผ่านการคัดเลือก",
          note: "คุณสมบัติและเอกสารถูกต้องครบถ้วน ผ่านเกณฑ์โควตาสาขาวิชา",
          changedBy: "ผู้ดูแลระบบงานรับสมัคร",
          timestamp: "2026-11-04 10:00:00"
        },
        {
          logId: "LOG-003",
          applicationNo: "Q70-0001",
          oldStatus: "ผ่านการคัดเลือก",
          newStatus: "มอบตัวแล้ว",
          note: "บันทึกมอบตัว ออกรหัสนักศึกษา: 70201010001",
          changedBy: "เจ้าหน้าที่ทะเบียน",
          timestamp: "2026-11-05 14:15:00"
        },
        {
          logId: "LOG-004",
          applicationNo: "Q70-0002",
          oldStatus: "",
          newStatus: "รอตรวจสอบ",
          note: "ผู้สมัครยื่นใบสมัครผ่านระบบออนไลน์",
          changedBy: "System",
          timestamp: "2026-11-03 11:20:00"
        }
      ];
      localStorage.setItem(this.STORAGE_KEY_STATUS_LOG, JSON.stringify(sampleLogs));
    }
  }

  getConfig() {
    try {
      const data = localStorage.getItem(this.STORAGE_KEY_CONFIG);
      return data ? JSON.parse(data) : DEFAULT_CONFIG;
    } catch (e) {
      return DEFAULT_CONFIG;
    }
  }

  saveConfig(newConfig) {
    const current = this.getConfig();
    const updated = { ...current, ...newConfig };
    localStorage.setItem(this.STORAGE_KEY_CONFIG, JSON.stringify(updated));
    return updated;
  }

  // เรียก API ไปยัง Google Apps Script หากมีการกำหนด URL ไว้
  async callGasApi(action, method = 'GET', data = null) {
    const config = this.getConfig();
    if (!config.gasApiUrl || config.gasApiUrl.trim() === '') {
      return null; // ยังไม่ได้เชื่อมต่อ GAS ให้ใช้ LocalStorage Mode
    }

    const url = config.gasApiUrl.trim();
    if (method === 'GET') {
      const queryParams = new URLSearchParams({ action, ...data });
      const response = await fetch(`${url}?${queryParams.toString()}`);
      return await response.json();
    } else {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ action, ...data })
      });
      return await response.json();
    }
  }

  // ยื่นใบสมัคร (Submit)
  async submitApplicant(formData) {
    const config = this.getConfig();

    // ลองส่งผ่าน Google Apps Script API ถ้าตั้งค่าไว้
    if (config.gasApiUrl) {
      try {
        const gasResult = await this.callGasApi('submitApplication', 'POST', { data: formData });
        if (gasResult && gasResult.success) {
          // เก็บสำเนาไว้ใน LocalStorage ด้วย
          this.saveApplicantLocal(formData, gasResult.applicationNo);
          return gasResult;
        }
      } catch (e) {
        console.warn("GAS API call failed, falling back to local storage:", e);
      }
    }

    // Local Storage Fallback
    const applicants = this.getApplicantsLocal();
    const cleanId = String(formData.nationalId).trim();
    const academicYear = config.academicYear || '2570';

    // ตรวจสอบเลขประจำตัวประชาชนซ้ำในปีการศึกษาเดียวกัน
    const isDup = applicants.some(a => a.nationalId === cleanId && a.academicYear === academicYear);
    if (isDup) {
      return {
        success: false,
        message: `เลขประจำตัวประชาชนนี้ได้ยื่นใบสมัครในปีการศึกษา ${academicYear} ไปแล้ว ไม่สามารถสมัครซ้ำได้`
      };
    }

    // ออกเลขที่ใบสมัครอัตโนมัติ เช่น Q70-0003
    const prefix = `Q${academicYear.slice(-2)}-`;
    let maxSeq = 0;
    applicants.forEach(a => {
      if (a.applicationNo && a.applicationNo.startsWith(prefix)) {
        const num = parseInt(a.applicationNo.replace(prefix, ''), 10);
        if (!isNaN(num) && num > maxSeq) maxSeq = num;
      }
    });
    const appNo = `${prefix}${String(maxSeq + 1).padStart(4, '0')}`;

    const newRecord = {
      ...formData,
      applicationNo: appNo,
      timestamp: formatDateTime(new Date()),
      academicYear: academicYear,
      status: 'รอตรวจสอบ',
      staffNote: '',
      studentId: '',
      enrolledAt: '',
      enrolledBy: ''
    };

    applicants.push(newRecord);
    localStorage.setItem(this.STORAGE_KEY_APPLICANTS, JSON.stringify(applicants));

    // บันทึก Status Log
    this.addStatusLog(appNo, '', 'รอตรวจสอบ', 'ผู้สมัครยื่นใบสมัครผ่านระบบออนไลน์', 'System');

    return {
      success: true,
      message: 'บันทึกข้อมูลการสมัครเรียบร้อยแล้ว',
      applicationNo: appNo,
      academicYear: academicYear,
      timestamp: newRecord.timestamp
    };
  }

  saveApplicantLocal(formData, appNo) {
    const applicants = this.getApplicantsLocal();
    const record = {
      ...formData,
      applicationNo: appNo,
      timestamp: formatDateTime(new Date()),
      status: 'รอตรวจสอบ'
    };
    applicants.push(record);
    localStorage.setItem(this.STORAGE_KEY_APPLICANTS, JSON.stringify(applicants));
  }

  getApplicantsLocal() {
    try {
      const data = localStorage.getItem(this.STORAGE_KEY_APPLICANTS);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      return [];
    }
  }

  // ค้นหาสถานะด้วยเลขประจำตัวประชาชน
  async checkStatus(nationalId) {
    const cleanId = String(nationalId).trim();
    const config = this.getConfig();

    if (config.gasApiUrl) {
      try {
        const res = await this.callGasApi('checkStatus', 'GET', { nationalId: cleanId });
        if (res && res.success) return res;
      } catch (e) {
        console.warn("GAS API checkStatus fallback to local:", e);
      }
    }

    const applicants = this.getApplicantsLocal();
    const matched = applicants.slice().reverse().find(a => a.nationalId === cleanId);

    if (!matched) {
      return { success: false, message: 'ไม่พบข้อมูลการสมัครของเลขประจำตัวประชาชนนี้' };
    }

    return {
      success: true,
      data: matched
    };
  }

  // อัปโหลดเอกสารใหม่กรณีสถานะเป็นเอกสารไม่ครบ
  async reuploadDocument(applicationNo, docType, fileData) {
    const config = this.getConfig();
    if (config.gasApiUrl) {
      try {
        const res = await this.callGasApi('reuploadDocument', 'POST', {
          data: { applicationNo, docType, fileData }
        });
        if (res && res.success) return res;
      } catch (e) {
        console.warn("GAS API reuploadDocument fallback:", e);
      }
    }

    const applicants = this.getApplicantsLocal();
    const item = applicants.find(a => a.applicationNo === applicationNo);
    if (item) {
      if (!item.files) item.files = [];
      const existing = item.files.find(f => f.docType === docType);
      if (existing) {
        existing.name = fileData.name;
        existing.url = fileData.base64;
      } else {
        item.files.push({ docType, name: fileData.name, url: fileData.base64 });
      }
      item.status = 'รอตรวจสอบ';
      item.staffNote = 'ผู้สมัครได้อัปโหลดเอกสารแก้ไขเพิ่มเติมแล้ว';
      localStorage.setItem(this.STORAGE_KEY_APPLICANTS, JSON.stringify(applicants));

      this.addStatusLog(applicationNo, 'เอกสารไม่ครบ', 'รอตรวจสอบ', `ผู้สมัครอัปโหลดเอกสารแก้ไข (${docType})`, 'Applicant');
    }

    return {
      success: true,
      message: 'อัปโหลดเอกสารแก้ไขเรียบร้อยแล้ว เจ้าหน้าที่จะดำเนินการตรวจสอบอีกครั้ง'
    };
  }

  // เปลี่ยนสถานะผู้สมัคร
  async updateStatus(applicationNo, newStatus, staffNote, staffUser) {
    const config = this.getConfig();
    if (config.gasApiUrl) {
      try {
        const res = await this.callGasApi('updateStatus', 'POST', {
          data: { applicationNo, newStatus, staffNote },
          staffUser
        });
        if (res && res.success) return res;
      } catch (e) {
        console.warn("GAS API updateStatus fallback:", e);
      }
    }

    const applicants = this.getApplicantsLocal();
    const item = applicants.find(a => a.applicationNo === applicationNo);
    if (!item) return { success: false, message: 'ไม่พบใบสมัคร' };

    const oldStatus = item.status;
    item.status = newStatus;
    item.staffNote = staffNote || '';
    localStorage.setItem(this.STORAGE_KEY_APPLICANTS, JSON.stringify(applicants));

    const operator = staffUser && staffUser.fullName ? staffUser.fullName : 'เจ้าหน้าที่';
    this.addStatusLog(applicationNo, oldStatus, newStatus, staffNote || '', operator);

    return { success: true, message: 'บันทึกการเปลี่ยนสถานะเรียบร้อยแล้ว' };
  }

  // บันทึกการมอบตัว
  async enrollStudent(applicationNo, enrolledNotes, staffUser) {
    const config = this.getConfig();
    if (config.gasApiUrl) {
      try {
        const res = await this.callGasApi('enrollStudent', 'POST', {
          data: { applicationNo, enrolledNotes },
          staffUser
        });
        if (res && res.success) return res;
      } catch (e) {
        console.warn("GAS API enrollStudent fallback:", e);
      }
    }

    const applicants = this.getApplicantsLocal();
    const item = applicants.find(a => a.applicationNo === applicationNo);
    if (!item) return { success: false, message: 'ไม่พบใบสมัคร' };

    // ออกรหัสนักศึกษาอัตโนมัติ เช่น 70201010002
    const prefix = '702010';
    let maxNum = 0;
    applicants.forEach(a => {
      if (a.studentId && a.studentId.startsWith(prefix)) {
        const num = parseInt(a.studentId.replace(prefix, ''), 10);
        if (!isNaN(num) && num > maxNum) maxNum = num;
      }
    });
    const studentId = `${prefix}${String(maxNum + 1).padStart(5, '0')}`;

    const operator = staffUser && staffUser.fullName ? staffUser.fullName : 'เจ้าหน้าที่ทะเบียน';
    item.status = 'มอบตัวแล้ว';
    item.studentId = studentId;
    item.enrolledAt = formatDateTime(new Date());
    item.enrolledBy = operator;
    if (enrolledNotes) item.staffNote = enrolledNotes;

    localStorage.setItem(this.STORAGE_KEY_APPLICANTS, JSON.stringify(applicants));
    this.addStatusLog(applicationNo, 'ผ่านการคัดเลือก', 'มอบตัวแล้ว', `บันทึกมอบตัว ออกรหัสนักศึกษา: ${studentId}`, operator);

    return {
      success: true,
      message: 'บันทึกการมอบตัวสำเร็จ',
      studentId: studentId
    };
  }

  addStatusLog(applicationNo, oldStatus, newStatus, note, changedBy) {
    try {
      const raw = localStorage.getItem(this.STORAGE_KEY_STATUS_LOG);
      const logs = raw ? JSON.parse(raw) : [];
      logs.push({
        logId: `LOG-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        applicationNo,
        oldStatus,
        newStatus,
        note,
        changedBy,
        timestamp: formatDateTime(new Date())
      });
      localStorage.setItem(this.STORAGE_KEY_STATUS_LOG, JSON.stringify(logs));
    } catch (e) {}
  }

  getStatusLogs(applicationNo) {
    try {
      const raw = localStorage.getItem(this.STORAGE_KEY_STATUS_LOG);
      const logs = raw ? JSON.parse(raw) : [];
      return logs.filter(l => l.applicationNo === applicationNo);
    } catch (e) {
      return [];
    }
  }

  // Session Management
  getStaffSession() {
    try {
      const session = sessionStorage.getItem(this.STORAGE_KEY_STAFF_SESSION);
      return session ? JSON.parse(session) : null;
    } catch (e) {
      return null;
    }
  }

  setStaffSession(user) {
    sessionStorage.setItem(this.STORAGE_KEY_STAFF_SESSION, JSON.stringify(user));
  }

  clearStaffSession() {
    sessionStorage.removeItem(this.STORAGE_KEY_STAFF_SESSION);
  }
}

// สร้าง Instance ของ Service
const storageService = new StorageService();

// ============================================================================
// ฟังก์ชันตัวช่วยการตรวจสอบข้อมูล (Validation Helpers)
// ============================================================================

/**
 * ตรวจสอบความถูกต้องของเลขประจำตัวประชาชน 13 หลัก ตามสูตรมาตรฐานกระทรวงมหาดไทย
 */
function validateThaiNationalID(idStr) {
  if (!idStr) return false;
  const cleanId = String(idStr).replace(/\D/g, '');
  if (cleanId.length !== 13) return false;

  let sum = 0;
  for (let i = 0; i < 12; i++) {
    sum += parseInt(cleanId.charAt(i), 10) * (13 - i);
  }

  const checkDigit = (11 - (sum % 11)) % 10;
  return checkDigit === parseInt(cleanId.charAt(12), 10);
}

/**
 * ตรวจสอบหมายเลขโทรศัพท์ 10 หลัก
 */
function validateThaiPhone(phoneStr) {
  if (!phoneStr) return false;
  const clean = String(phoneStr).replace(/\D/g, '');
  return clean.length === 10 && clean.startsWith('0');
}

/**
 * ตรวจสอบผลการเรียนเฉลี่ยสะสม (GPAX 0.00 - 4.00)
 */
function validateGPAX(gpaxStr) {
  if (!gpaxStr) return false;
  const num = parseFloat(gpaxStr);
  return !isNaN(num) && num >= 0.00 && num <= 4.00;
}

/**
 * แปลงเลขอารบิกเป็นเลขไทยสำหรับหัวเอกสารราชการ
 */
function toThaiNumerals(str) {
  if (!str) return '';
  const thaiDigits = ['๐', '๑', '๒', '๓', '๔', '๕', '๖', '๗', '๘', '๙'];
  return String(str).replace(/[0-9]/g, match => thaiDigits[parseInt(match, 10)]);
}

/**
 * จัดรูปแบบวันที่เวลาภาษาไทย
 */
function formatDateTime(date) {
  const d = new Date(date);
  const pad = n => String(n).padStart(2, '0');
  const y = d.getFullYear() + 543;
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${y} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

// ============================================================================
// การจัดการ UI และ Events
// ============================================================================

let currentUploadedFiles = {
  photo: null,
  transcript: null,
  idcard: null,
  portfolio: null
};

document.addEventListener('DOMContentLoaded', () => {
  initNavigation();
  initProvincesDropdown();
  loadSystemSettings();
  initFormInteractions();
  initStatusCheckEvents();
  initStaffPortal();
});

/**
 * การสลับหน้าผ่านเมนูหลัก (หน้าแรก / สมัครเรียน / ตรวจสอบสถานะ / เจ้าหน้าที่)
 */
function initNavigation() {
  const navLinks = document.querySelectorAll('.nav-link');
  const sections = document.querySelectorAll('.page-section');

  navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const targetId = link.getAttribute('data-target');

      navLinks.forEach(l => l.classList.remove('active'));
      link.classList.add('active');

      sections.forEach(sec => {
        if (sec.id === targetId) {
          sec.classList.add('active');
        } else {
          sec.classList.remove('active');
        }
      });

      // เลื่อนขึ้นด้านบน
      window.scrollTo({ top: 0, behavior: 'smooth' });

      // หากเปิดหน้าเจ้าหน้าที่และล็อกอินอยู่ ให้โหลดข้อมูลผู้สมัครล่าสุด
      if (targetId === 'section-staff') {
        const session = storageService.getStaffSession();
        if (session) {
          showStaffDashboard(session);
        }
      }
    });
  });
}

/**
 * โหลดรายชื่อ 77 จังหวัดเข้าสู่ Dropdown ทั้งหมด
 */
function initProvincesDropdown() {
  const provinceSelect = document.getElementById('applicant-province');
  if (provinceSelect && typeof THAI_PROVINCES !== 'undefined') {
    provinceSelect.innerHTML = '<option value="">-- กรุณาเลือกจังหวัด --</option>';
    THAI_PROVINCES.forEach(prov => {
      const opt = document.createElement('option');
      opt.value = prov;
      opt.textContent = prov;
      if (prov === 'สระบุรี') opt.selected = true; // ค่าปริยายวิทยาลัยตั้งอยู่ จ.สระบุรี
      provinceSelect.appendChild(opt);
    });
  }
}

/**
 * โหลดการตั้งค่าระบบ (กำหนดการ, รายการสาขาวิชา, ประกาศ)
 */
function loadSystemSettings() {
  const config = storageService.getConfig();

  // กำหนดข้อความประกาศหน้าแรก
  const announcementTitleEl = document.getElementById('home-announcement-title');
  const announcementBodyEl = document.getElementById('home-announcement-body');
  if (announcementTitleEl) announcementTitleEl.textContent = config.announcementTitle;
  if (announcementBodyEl) announcementBodyEl.textContent = config.announcementBody;

  // โหลดรายการสาขาวิชาในหน้าแรก
  const homePvcList = document.getElementById('home-pvc-list');
  const homePvsList = document.getElementById('home-pvs-list');

  if (homePvcList) {
    homePvcList.innerHTML = config.programsPvc.map(p => `<li>${p}</li>`).join('');
  }
  if (homePvsList) {
    homePvsList.innerHTML = config.programsPvs.map(p => `<li>${p}</li>`).join('');
  }

  // อัปเดตตัวเลือกสาขาวิชาในฟอร์มสมัคร
  updateProgramDropdowns();

  // ตรวจสอบสถานะการเปิดรับสมัคร
  const applyFormContainer = document.getElementById('apply-form-container');
  const applyClosedNotice = document.getElementById('apply-closed-notice');
  if (!config.systemOpen) {
    if (applyFormContainer) applyFormContainer.style.display = 'none';
    if (applyClosedNotice) applyClosedNotice.style.display = 'block';
  } else {
    if (applyFormContainer) applyFormContainer.style.display = 'block';
    if (applyClosedNotice) applyClosedNotice.style.display = 'none';
  }
}

/**
 * อัปเดต Dropdown สาขาวิชาตามระดับการศึกษาที่เลือก (ปวช. / ปวส.)
 */
function updateProgramDropdowns() {
  const config = storageService.getConfig();
  const selectedLevel = document.querySelector('input[name="apply_level"]:checked')?.value || 'ปวช.';

  const branch1Select = document.getElementById('applicant-branch1');
  const branch2Select = document.getElementById('applicant-branch2');
  const branch2Group = document.getElementById('branch2-group');
  const oldMajorGroup = document.getElementById('old-major-group');

  if (!branch1Select || !branch2Select) return;

  const isPvc = selectedLevel === 'ปวช.';
  const programList = isPvc ? config.programsPvc : config.programsPvs;

  // สร้างตัวเลือกสาขาวิชาลำดับที่ 1
  branch1Select.innerHTML = '<option value="">-- กรุณาเลือกสาขาวิชา --</option>';
  programList.forEach(prog => {
    const opt = document.createElement('option');
    opt.value = prog;
    opt.textContent = prog;
    branch1Select.appendChild(opt);
  });

  if (isPvc) {
    // ปวช. เลือก 2 ลำดับ
    if (branch2Group) branch2Group.style.display = 'block';
    branch2Select.innerHTML = '<option value="">-- กรุณาเลือกสาขาวิชาลำดับที่ 2 --</option>';
    programList.forEach(prog => {
      const opt = document.createElement('option');
      opt.value = prog;
      opt.textContent = prog;
      branch2Select.appendChild(opt);
    });
    if (oldMajorGroup) oldMajorGroup.style.display = 'none';
  } else {
    // ปวส. เลือก 1 ลำดับ
    if (branch2Group) branch2Group.style.display = 'none';
    branch2Select.value = '';
    if (oldMajorGroup) oldMajorGroup.style.display = 'block';
  }
}

/**
 * จัดการฟอร์มสมัครเรียน (Validation, File Upload, Submit)
 */
function initFormInteractions() {
  // สลับระดับการศึกษา
  const levelRadios = document.querySelectorAll('input[name="apply_level"]');
  levelRadios.forEach(radio => {
    radio.addEventListener('change', updateProgramDropdowns);
  });

  // การอัปโหลดไฟล์พร้อมแปลงเป็น Base64 และตรวจขนาดไฟล์ (ไม่เกิน 5 MB)
  setupFileUpload('upload-photo', 'photo-status-text', 'photo', ['image/jpeg', 'image/png'], 5);
  setupFileUpload('upload-transcript', 'transcript-status-text', 'transcript', ['image/jpeg', 'image/png', 'application/pdf'], 5);
  setupFileUpload('upload-idcard', 'idcard-status-text', 'idcard', ['image/jpeg', 'image/png', 'application/pdf'], 5);
  setupFileUpload('upload-portfolio', 'portfolio-status-text', 'portfolio', ['image/jpeg', 'image/png', 'application/pdf'], 5);

  // ส่งแบบฟอร์มสมัคร
  const applicationForm = document.getElementById('student-application-form');
  if (applicationForm) {
    applicationForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      await handleFormSubmission();
    });
  }
}

/**
 * ช่วยจัดการการอัปโหลดไฟล์และตรวจขนาด
 */
function setupFileUpload(inputId, statusId, fileKey, allowedTypes, maxSizeMB) {
  const inputEl = document.getElementById(inputId);
  const statusEl = document.getElementById(statusId);
  if (!inputEl || !statusEl) return;

  inputEl.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) {
      currentUploadedFiles[fileKey] = null;
      statusEl.textContent = 'ยังไม่ได้เลือกไฟล์';
      statusEl.className = 'file-status-text';
      return;
    }

    // ตรวจขนาดไฟล์
    const sizeInMB = file.size / (1024 * 1024);
    if (sizeInMB > maxSizeMB) {
      alert(`ไฟล์มีขนาดเกิน ${maxSizeMB} MB กรุณาเลือกไฟล์ใหม่`);
      inputEl.value = '';
      currentUploadedFiles[fileKey] = null;
      statusEl.textContent = `ไฟล์มีขนาดเกิน ${maxSizeMB} MB`;
      statusEl.className = 'file-status-text text-danger';
      return;
    }

    // อ่านเป็น DataURL Base64
    const reader = new FileReader();
    reader.onload = (event) => {
      currentUploadedFiles[fileKey] = {
        name: file.name,
        type: file.type,
        size: file.size,
        base64: event.target.result
      };
      statusEl.textContent = `เลือกไฟล์แล้ว: ${file.name} (${sizeInMB.toFixed(2)} MB)`;
      statusEl.className = 'file-status-text file-ready';
    };
    reader.readAsDataURL(file);
  });
}

/**
 * ประมวลผลและส่งใบสมัคร
 */
async function handleFormSubmission() {
  const submitBtn = document.getElementById('btn-submit-application');
  const errorAlert = document.getElementById('form-error-alert');

  // ดึงค่าจากฟอร์ม
  const level = document.querySelector('input[name="apply_level"]:checked')?.value;
  const title = document.getElementById('applicant-title')?.value;
  const fullName = document.getElementById('applicant-fullname')?.value?.trim();
  const birthDay = document.getElementById('applicant-birthday')?.value;
  const birthMonth = document.getElementById('applicant-birthmonth')?.value;
  const birthYear = document.getElementById('applicant-birthyear')?.value?.trim();
  const nationalId = document.getElementById('applicant-national-id')?.value?.trim();

  const fatherName = document.getElementById('father-name')?.value?.trim();
  const fatherAge = document.getElementById('father-age')?.value?.trim();
  const fatherJob = document.getElementById('father-job')?.value?.trim();

  const motherName = document.getElementById('mother-name')?.value?.trim();
  const motherAge = document.getElementById('mother-age')?.value?.trim();
  const motherJob = document.getElementById('mother-job')?.value?.trim();

  const addressHouseNo = document.getElementById('applicant-houseno')?.value?.trim();
  const addressMoo = document.getElementById('applicant-moo')?.value?.trim() || '-';
  const addressSoi = document.getElementById('applicant-soi')?.value?.trim() || '-';
  const addressRoad = document.getElementById('applicant-road')?.value?.trim() || '-';
  const addressSubdistrict = document.getElementById('applicant-subdistrict')?.value?.trim();
  const addressDistrict = document.getElementById('applicant-district')?.value?.trim();
  const addressProvince = document.getElementById('applicant-province')?.value;
  const addressPostalCode = document.getElementById('applicant-postalcode')?.value?.trim();
  const phone = document.getElementById('applicant-phone')?.value?.trim();

  const currentLevel = document.getElementById('applicant-current-level')?.value;
  const schoolName = document.getElementById('applicant-school-name')?.value?.trim();
  const schoolLocation = document.getElementById('applicant-school-location')?.value?.trim();
  const gpax = document.getElementById('applicant-gpax')?.value?.trim();
  const oldMajor = document.getElementById('applicant-old-major')?.value?.trim() || '-';

  const branchOrder1 = document.getElementById('applicant-branch1')?.value;
  const branchOrder2 = document.getElementById('applicant-branch2')?.value;

  const pdpaConsent = document.getElementById('pdpa-consent-checkbox')?.checked;

  // ฟังก์ชันแสดงข้อความแจ้งเตือนความผิดพลาด
  const showError = (msg) => {
    if (errorAlert) {
      errorAlert.textContent = msg;
      errorAlert.style.display = 'block';
      errorAlert.scrollIntoView({ behavior: 'smooth', block: 'center' });
    } else {
      alert(msg);
    }
  };

  if (errorAlert) errorAlert.style.display = 'none';

  // 1. ตรวจสอบช่องบังคับ
  if (!level || !title || !fullName || !birthDay || !birthMonth || !birthYear || !nationalId) {
    showError('กรุณากรอกข้อมูลผู้สมัครให้ครบถ้วนทุกช่อง');
    return;
  }

  // 2. ตรวจสอบเลขประจำตัวประชาชน
  if (!validateThaiNationalID(nationalId)) {
    showError('เลขประจำตัวประชาชน 13 หลักไม่ถูกต้องตามหลักการคำนวณ กรุณาตรวจสอบอีกครั้ง');
    document.getElementById('applicant-national-id')?.focus();
    return;
  }

  // 3. ตรวจสอบข้อมูลที่อยู่และเบอร์โทร
  if (!addressHouseNo || !addressSubdistrict || !addressDistrict || !addressProvince || !addressPostalCode || !phone) {
    showError('กรุณากรอกข้อมูลที่อยู่ปัจจุบันและหมายเลขโทรศัพท์ให้ครบถ้วน');
    return;
  }

  if (!validateThaiPhone(phone)) {
    showError('หมายเลขโทรศัพท์ต้องเป็นตัวเลขอารบิก 10 หลัก และขึ้นต้นด้วย 0 (เช่น 0812345678)');
    document.getElementById('applicant-phone')?.focus();
    return;
  }

  // 4. ตรวจสอบข้อมูลการศึกษาและเกรดเฉลี่ย
  if (!schoolName || !schoolLocation || !gpax) {
    showError('กรุณากรอกข้อมูลสถานศึกษาเดิมและผลการเรียนเฉลี่ยสะสม (GPAX)');
    return;
  }

  if (!validateGPAX(gpax)) {
    showError('ผลการเรียนเฉลี่ยสะสม (GPAX) ต้องเป็นตัวเลขระหว่าง 0.00 ถึง 4.00');
    document.getElementById('applicant-gpax')?.focus();
    return;
  }

  // 5. ตรวจสอบสาขาวิชา
  if (!branchOrder1) {
    showError('กรุณาเลือกสาขาวิชาที่ต้องการสมัคร');
    return;
  }

  if (level === 'ปวช.') {
    if (!branchOrder2) {
      showError('ระดับ ปวช. กรุณาเลือกสาขาวิชาลำดับที่ 2');
      return;
    }
    if (branchOrder1 === branchOrder2) {
      showError('สาขาวิชาลำดับที่ 1 และลำดับที่ 2 ห้ามเลือกซ้ำกัน');
      document.getElementById('applicant-branch2')?.focus();
      return;
    }
  }

  // 6. ตรวจสอบไฟล์บังคับ
  if (!currentUploadedFiles.photo) {
    showError('กรุณาแนบไฟล์รูปถ่ายหน้าตรงขนาด 1 นิ้ว');
    return;
  }
  if (!currentUploadedFiles.transcript) {
    showError('กรุณาแนบเอกสารแสดงผลการเรียนเฉลี่ยสะสม 5 ภาคเรียน (ปพ.1)');
    return;
  }
  if (!currentUploadedFiles.idcard) {
    showError('กรุณาแนบสำเนาบัตรประชาชน หรือสำเนาทะเบียนบ้าน');
    return;
  }

  // 7. ตรวจสอบการยินยอม PDPA
  if (!pdpaConsent) {
    showError('กรุณาทำเครื่องหมายยินยอมการจัดเก็บและประมวลผลข้อมูลส่วนบุคคลตาม PDPA ก่อนยื่นใบสมัคร');
    return;
  }

  // เริ่มส่งข้อมูล
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.innerHTML = 'กำลังบันทึกข้อมูลใบสมัคร...';
  }

  const payload = {
    level,
    title,
    fullName,
    birthDate: `${birthDay} ${birthMonth} ${birthYear}`,
    nationalId,
    fatherName,
    fatherAge,
    fatherJob,
    motherName,
    motherAge,
    motherJob,
    addressHouseNo,
    addressMoo,
    addressSoi,
    addressRoad,
    addressSubdistrict,
    addressDistrict,
    addressProvince,
    addressPostalCode,
    phone,
    currentLevel,
    schoolName,
    schoolLocation,
    gpax,
    oldMajor: level.startsWith('ปวส') ? oldMajor : '-',
    branchOrder1,
    branchOrder2: level === 'ปวช.' ? branchOrder2 : '',
    files: [
      { docType: 'PHOTO_1INCH', name: currentUploadedFiles.photo.name, type: currentUploadedFiles.photo.type, base64: currentUploadedFiles.photo.base64 },
      { docType: 'GPAX_TRANSCRIPT', name: currentUploadedFiles.transcript.name, type: currentUploadedFiles.transcript.type, base64: currentUploadedFiles.transcript.base64 },
      { docType: 'CITIZEN_ID_CARD', name: currentUploadedFiles.idcard.name, type: currentUploadedFiles.idcard.type, base64: currentUploadedFiles.idcard.base64 }
    ]
  };

  if (currentUploadedFiles.portfolio) {
    payload.files.push({
      docType: 'CERTIFICATE',
      name: currentUploadedFiles.portfolio.name,
      type: currentUploadedFiles.portfolio.type,
      base64: currentUploadedFiles.portfolio.base64
    });
  }

  try {
    const res = await storageService.submitApplicant(payload);
    if (res.success) {
      showApplicationSuccessModal(res.applicationNo, payload);
      document.getElementById('student-application-form').reset();
      currentUploadedFiles = { photo: null, transcript: null, idcard: null, portfolio: null };
      document.querySelectorAll('.file-status-text').forEach(el => {
        el.textContent = 'ยังไม่ได้เลือกไฟล์';
        el.className = 'file-status-text';
      });
    } else {
      showError(res.message || 'เกิดข้อผิดพลาดในการบันทึกข้อมูล');
    }
  } catch (err) {
    showError('เกิดข้อผิดพลาดในการเชื่อมต่อระบบ: ' + err.toString());
  } finally {
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.innerHTML = 'ส่งใบสมัคร';
    }
  }
}

/**
 * แสดงหน้าต่างบันทึกสำเร็จ พร้อมปุ่มพิมพ์ใบสมัคร
 */
function showApplicationSuccessModal(applicationNo, applicantData) {
  const modal = document.getElementById('submission-success-modal');
  const appNoEl = document.getElementById('success-app-no');
  const nameEl = document.getElementById('success-app-name');
  const branchEl = document.getElementById('success-app-branch');

  if (appNoEl) appNoEl.textContent = applicationNo;
  if (nameEl) nameEl.textContent = `${applicantData.title} ${applicantData.fullName}`;
  if (branchEl) {
    let bText = applicantData.branchOrder1;
    if (applicantData.branchOrder2) bText += ` / ${applicantData.branchOrder2}`;
    branchEl.textContent = `${applicantData.level} (${bText})`;
  }

  if (modal) modal.classList.add('active');

  const printBtn = document.getElementById('btn-print-from-success');
  if (printBtn) {
    printBtn.onclick = () => {
      const fullRecord = { ...applicantData, applicationNo };
      printOfficialApplicationDoc(fullRecord);
    };
  }
}

/**
 * จัดการส่วนตรวจสอบสถานะ
 */
function initStatusCheckEvents() {
  const btnSearch = document.getElementById('btn-check-status');
  const inputId = document.getElementById('search-national-id');
  const resultCard = document.getElementById('status-result-card');
  const notFoundAlert = document.getElementById('status-notfound-alert');

  if (!btnSearch || !inputId) return;

  btnSearch.addEventListener('click', async () => {
    const nationalId = inputId.value.trim();
    if (!nationalId || nationalId.length !== 13) {
      alert('กรุณากรอกเลขประจำตัวประชาชน 13 หลัก');
      return;
    }

    if (notFoundAlert) notFoundAlert.style.display = 'none';
    if (resultCard) resultCard.style.display = 'none';
    btnSearch.disabled = true;
    btnSearch.textContent = 'กำลังค้นหา...';

    try {
      const res = await storageService.checkStatus(nationalId);
      if (res.success && res.data) {
        displayApplicantStatusResult(res.data);
      } else {
        if (notFoundAlert) {
          notFoundAlert.textContent = res.message || 'ไม่พบข้อมูลการสมัครของเลขประจำตัวประชาชนนี้';
          notFoundAlert.style.display = 'block';
        }
      }
    } catch (e) {
      alert('เกิดข้อผิดพลาดในการตรวจสอบสถานะ: ' + e.toString());
    } finally {
      btnSearch.disabled = false;
      btnSearch.textContent = 'ตรวจสอบสถานะ';
    }
  });
}

/**
 * แสดงผลสถานะผู้สมัคร
 */
function displayApplicantStatusResult(data) {
  const card = document.getElementById('status-result-card');
  if (!card) return;

  document.getElementById('status-app-no').textContent = data.applicationNo;
  document.getElementById('status-app-name').textContent = `${data.title} ${data.fullName}`;
  document.getElementById('status-app-level').textContent = data.level;
  
  let branchText = data.branchOrder1;
  if (data.branchOrder2) branchText += ` (ลำดับที่ 2: ${data.branchOrder2})`;
  document.getElementById('status-app-branch').textContent = branchText;
  document.getElementById('status-app-date').textContent = data.timestamp;

  const badgeEl = document.getElementById('status-badge-container');
  badgeEl.innerHTML = renderStatusBadge(data.status);

  // หมายเหตุจากเจ้าหน้าที่
  const noteBox = document.getElementById('status-note-container');
  const noteText = document.getElementById('status-note-text');
  if (data.staffNote && data.staffNote.trim() !== '') {
    noteText.textContent = data.staffNote;
    noteBox.style.display = 'block';
  } else {
    noteBox.style.display = 'none';
  }

  // รหัสนักศึกษา (กรณีมอบตัวแล้ว)
  const studentIdGroup = document.getElementById('status-studentid-group');
  if (data.studentId) {
    document.getElementById('status-studentid-val').textContent = data.studentId;
    studentIdGroup.style.display = 'block';
  } else {
    studentIdGroup.style.display = 'none';
  }

  // อัปโหลดเอกสารแก้ไขกรณี "เอกสารไม่ครบ"
  const reuploadCard = document.getElementById('reupload-docs-card');
  if (data.status === 'เอกสารไม่ครบ') {
    reuploadCard.style.display = 'block';
    setupReuploadHandler(data.applicationNo);
  } else {
    reuploadCard.style.display = 'none';
  }

  // ปุ่มพิมพ์ใบสมัคร
  const reprintBtn = document.getElementById('btn-reprint-application');
  if (reprintBtn) {
    reprintBtn.onclick = () => printOfficialApplicationDoc(data);
  }

  card.style.display = 'block';
}

function setupReuploadHandler(applicationNo) {
  const btn = document.getElementById('btn-submit-reupload');
  const fileInput = document.getElementById('reupload-file-input');
  const docTypeSelect = document.getElementById('reupload-doctype-select');
  if (!btn || !fileInput) return;

  btn.onclick = async () => {
    const file = fileInput.files[0];
    const docType = docTypeSelect.value;
    if (!file) {
      alert('กรุณาเลือกไฟล์ที่ต้องการส่งแก้ไข');
      return;
    }

    btn.disabled = true;
    btn.textContent = 'กำลังอัปโหลด...';

    const reader = new FileReader();
    reader.onload = async (e) => {
      const fileData = {
        name: file.name,
        type: file.type,
        base64: e.target.result
      };

      const res = await storageService.reuploadDocument(applicationNo, docType, fileData);
      alert(res.message);
      btn.disabled = false;
      btn.textContent = 'ส่งเอกสารแก้ไข';
      document.getElementById('btn-check-status').click(); // โหลดสถานะใหม่
    };
    reader.readAsDataURL(file);
  };
}

// ============================================================================
// ระบบเจ้าหน้าที่และแดชบอร์ด (Staff Portal)
// ============================================================================

let currentChartInstance = null;

function initStaffPortal() {
  const loginForm = document.getElementById('staff-login-form');
  const logoutBtn = document.getElementById('btn-staff-logout');

  if (loginForm) {
    loginForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const u = document.getElementById('staff-username').value.trim();
      const p = document.getElementById('staff-password').value.trim();
      handleStaffLogin(u, p);
    });
  }

  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      storageService.clearStaffSession();
      document.getElementById('staff-logged-view').style.display = 'none';
      document.getElementById('staff-login-view').style.display = 'block';
    });
  }

  // การสลับแท็บในส่วนเจ้าหน้าที่
  const staffTabs = document.querySelectorAll('.staff-tab-btn');
  staffTabs.forEach(btn => {
    btn.addEventListener('click', () => {
      staffTabs.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const targetTab = btn.getAttribute('data-tab');
      document.querySelectorAll('.staff-tab-content').forEach(c => {
        c.style.display = (c.id === targetTab) ? 'block' : 'none';
      });

      if (targetTab === 'tab-staff-dashboard') {
        renderDashboardStats();
      } else if (targetTab === 'tab-staff-applicants') {
        renderApplicantsTable();
      }
    });
  });

  // ตัวกรองในตารางผู้สมัคร
  const searchInput = document.getElementById('filter-search');
  const levelFilter = document.getElementById('filter-level');
  const statusFilter = document.getElementById('filter-status');

  [searchInput, levelFilter, statusFilter].forEach(el => {
    if (el) {
      el.addEventListener('input', () => renderApplicantsTable());
      el.addEventListener('change', () => renderApplicantsTable());
    }
  });

  // ปุ่ม Export ข้อมูล
  const btnExport = document.getElementById('btn-export-csv');
  if (btnExport) {
    btnExport.addEventListener('click', exportApplicantsCsv);
  }

  // บันทึกการตั้งค่าระบบ
  const settingsForm = document.getElementById('settings-config-form');
  if (settingsForm) {
    settingsForm.addEventListener('submit', handleSaveSettingsForm);
  }
}

function handleStaffLogin(username, password) {
  // บัญชีเจ้าหน้าที่มาตรฐาน
  const validUsers = [
    { username: 'admin', password: 'admin2570', fullName: 'ผู้ดูแลระบบงานรับสมัคร', role: 'ผู้ดูแลระบบ' },
    { username: 'registrar', password: 'reg2570', fullName: 'เจ้าหน้าที่งานทะเบียนและประมวลผล', role: 'เจ้าหน้าที่ทะเบียน' }
  ];

  const matched = validUsers.find(u => u.username === username && u.password === password);
  if (matched) {
    storageService.setStaffSession(matched);
    showStaffDashboard(matched);
  } else {
    alert('ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง');
  }
}

function showStaffDashboard(user) {
  document.getElementById('staff-login-view').style.display = 'none';
  document.getElementById('staff-logged-view').style.display = 'block';

  document.getElementById('staff-user-name').textContent = user.fullName;
  document.getElementById('staff-user-role').textContent = `[สิทธิ์: ${user.role}]`;

  // ซ่อนแท็บการตั้งค่าหากไม่ใช่ผู้ดูแลระบบ
  const settingsTabBtn = document.querySelector('[data-tab="tab-staff-settings"]');
  if (settingsTabBtn) {
    settingsTabBtn.style.display = (user.role === 'ผู้ดูแลระบบ') ? 'inline-block' : 'none';
  }

  renderApplicantsTable();
  renderDashboardStats();
  populateSettingsForm();
}

/**
 * แสดงตารางผู้สมัครแบบทะเบียนทางการ
 */
function renderApplicantsTable() {
  const tableBody = document.getElementById('applicants-tbody');
  if (!tableBody) return;

  const applicants = storageService.getApplicantsLocal();
  const searchKeyword = document.getElementById('filter-search')?.value?.trim().toLowerCase() || '';
  const levelFilter = document.getElementById('filter-level')?.value || '';
  const statusFilter = document.getElementById('filter-status')?.value || '';

  const filtered = applicants.filter(a => {
    const matchSearch = !searchKeyword ||
      a.applicationNo.toLowerCase().includes(searchKeyword) ||
      a.fullName.toLowerCase().includes(searchKeyword) ||
      a.nationalId.includes(searchKeyword);

    const matchLevel = !levelFilter || a.level.startsWith(levelFilter);
    const matchStatus = !statusFilter || a.status === statusFilter;

    return matchSearch && matchLevel && matchStatus;
  });

  if (filtered.length === 0) {
    tableBody.innerHTML = `<tr><td colspan="8" style="text-align: center; color: var(--text-muted); padding: 24px;">ไม่พบข้อมูลผู้สมัครตามเงื่อนไขที่เลือก</td></tr>`;
    return;
  }

  tableBody.innerHTML = filtered.map((a, index) => {
    let branchInfo = a.branchOrder1;
    if (a.branchOrder2) branchInfo += ` / ${a.branchOrder2}`;

    return `
      <tr>
        <td style="text-align: center;">${index + 1}</td>
        <td><strong>${a.applicationNo}</strong></td>
        <td>${a.title}${a.fullName}</td>
        <td>${a.level}</td>
        <td>${branchInfo}</td>
        <td style="text-align: center;">${a.gpax || '-'}</td>
        <td style="text-align: center;">${renderStatusBadge(a.status)}</td>
        <td style="text-align: center;">
          <button class="btn btn-secondary btn-sm" onclick="openApplicantDetailModal('${a.applicationNo}')">ตรวจเอกสาร / จัดการ</button>
        </td>
      </tr>
    `;
  }).join('');
}

/**
 * แดชบอร์ดสรุปสถิติและกราฟสีเดียวแบบเรียบ
 */
function renderDashboardStats() {
  const applicants = storageService.getApplicantsLocal();

  const total = applicants.length;
  const pending = applicants.filter(a => a.status === 'รอตรวจสอบ').length;
  const approved = applicants.filter(a => a.status === 'ผ่านการคัดเลือก').length;
  const incomplete = applicants.filter(a => a.status === 'เอกสารไม่ครบ').length;
  const enrolled = applicants.filter(a => a.status === 'มอบตัวแล้ว').length;

  document.getElementById('stat-total-count').textContent = total;
  document.getElementById('stat-pending-count').textContent = pending;
  document.getElementById('stat-approved-count').textContent = approved;
  document.getElementById('stat-incomplete-count').textContent = incomplete;
  document.getElementById('stat-enrolled-count').textContent = enrolled;

  // กราฟสรุปผู้สมัครแยกตามสาขาวิชา (Monochromatic Navy Shades)
  const branchCounts = {};
  applicants.forEach(a => {
    if (a.branchOrder1) {
      branchCounts[a.branchOrder1] = (branchCounts[a.branchOrder1] || 0) + 1;
    }
  });

  const labels = Object.keys(branchCounts);
  const data = Object.values(branchCounts);

  const ctx = document.getElementById('branchChart');
  if (ctx && typeof Chart !== 'undefined') {
    if (currentChartInstance) {
      currentChartInstance.destroy();
    }

    currentChartInstance = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels.length > 0 ? labels : ['ยังไม่มีข้อมูลผู้สมัคร'],
        datasets: [{
          label: 'จำนวนผู้สมัคร (คน)',
          data: data.length > 0 ? data : [0],
          backgroundColor: '#1F3A5F',
          borderColor: '#162B47',
          borderWidth: 1,
          borderRadius: 2
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: { precision: 0, font: { family: 'Sarabun' } },
            grid: { color: '#E2E8F0' }
          },
          x: {
            ticks: { font: { family: 'Sarabun' } },
            grid: { display: false }
          }
        }
      }
    });
  }

  // ตารางโรงเรียนเดิมและจังหวัดยอดนิยม
  renderSchoolAndProvinceStats(applicants);
}

function renderSchoolAndProvinceStats(applicants) {
  const provCounts = {};
  const schoolCounts = {};

  applicants.forEach(a => {
    if (a.addressProvince) provCounts[a.addressProvince] = (provCounts[a.addressProvince] || 0) + 1;
    if (a.schoolName) schoolCounts[a.schoolName] = (schoolCounts[a.schoolName] || 0) + 1;
  });

  const sortedProv = Object.entries(provCounts).sort((a,b) => b[1] - a[1]).slice(0, 5);
  const provTbody = document.getElementById('stats-prov-tbody');
  if (provTbody) {
    provTbody.innerHTML = sortedProv.map(([prov, count]) => `
      <tr><td>${prov}</td><td style="text-align: right; font-weight: 600;">${count} คน</td></tr>
    `).join('') || '<tr><td colspan="2" style="text-align: center;">ไม่มีข้อมูล</td></tr>';
  }

  const sortedSchools = Object.entries(schoolCounts).sort((a,b) => b[1] - a[1]).slice(0, 5);
  const schoolTbody = document.getElementById('stats-school-tbody');
  if (schoolTbody) {
    schoolTbody.innerHTML = sortedSchools.map(([sch, count]) => `
      <tr><td>${sch}</td><td style="text-align: right; font-weight: 600;">${count} คน</td></tr>
    `).join('') || '<tr><td colspan="2" style="text-align: center;">ไม่มีข้อมูล</td></tr>';
  }
}

/**
 * หน้าต่างดูรายละเอียดผู้สมัคร ตรวจเอกสาร และเปลี่ยนสถานะ
 */
window.openApplicantDetailModal = function(applicationNo) {
  const applicants = storageService.getApplicantsLocal();
  const applicant = applicants.find(a => a.applicationNo === applicationNo);
  if (!applicant) return;

  const modal = document.getElementById('applicant-detail-modal');
  document.getElementById('modal-detail-title').textContent = `รายละเอียดใบสมัครเลขที่: ${applicant.applicationNo}`;

  // ข้อมูลส่วนตัว
  document.getElementById('detail-fullname').textContent = `${applicant.title} ${applicant.fullName}`;
  document.getElementById('detail-nationalid').textContent = applicant.nationalId;
  document.getElementById('detail-birthdate').textContent = applicant.birthDate;
  document.getElementById('detail-level').textContent = applicant.level;
  document.getElementById('detail-branches').textContent = `ลำดับ 1: ${applicant.branchOrder1} ${applicant.branchOrder2 ? '| ลำดับ 2: ' + applicant.branchOrder2 : ''}`;
  document.getElementById('detail-gpax').textContent = applicant.gpax || '-';
  document.getElementById('detail-school').textContent = `${applicant.schoolName || '-'} (${applicant.schoolLocation || '-'})`;
  document.getElementById('detail-phone').textContent = applicant.phone;
  document.getElementById('detail-address').textContent = `บ้านเลขที่ ${applicant.addressHouseNo} ม.${applicant.addressMoo} ต.${applicant.addressSubdistrict} อ.${applicant.addressDistrict} จ.${applicant.addressProvince} ${applicant.addressPostalCode}`;

  // แสดงรูปถ่าย
  const photoBox = document.getElementById('detail-photo-preview');
  const photoFile = applicant.files?.find(f => f.docType === 'PHOTO_1INCH');
  if (photoFile && photoFile.url) {
    photoBox.innerHTML = `<img src="${photoFile.url}" alt="รูปถ่าย 1 นิ้ว" style="width: 100%; height: 100%; object-fit: cover;">`;
  } else {
    photoBox.innerHTML = '<span style="font-size: 11px; color: var(--text-muted);">ไม่มีรูปถ่าย</span>';
  }

  // เอกสารแนบ
  const docContainer = document.getElementById('detail-docs-list');
  if (applicant.files && applicant.files.length > 0) {
    docContainer.innerHTML = applicant.files.map(f => `
      <div style="border: 1px solid var(--border-color); padding: 8px 12px; border-radius: var(--radius); margin-bottom: 6px; display: flex; justify-content: space-between; align-items: center;">
        <div>
          <span style="font-weight: 600;">${getDocTypeName(f.docType)}:</span>
          <span style="color: var(--text-secondary); margin-left: 6px;">${f.name}</span>
        </div>
        <div>
          ${f.url && f.url !== '#' ? `<a href="${f.url}" target="_blank" class="btn btn-secondary btn-sm">เปิดดูเอกสาร</a>` : '<span style="color: var(--text-muted); font-size: 12px;">เอกสารแนบในระบบ</span>'}
        </div>
      </div>
    `).join('');
  } else {
    docContainer.innerHTML = '<div style="color: var(--text-muted);">ไม่มีเอกสารแนบ</div>';
  }

  // ประวัติการเปลี่ยนสถานะ (Audit Trail)
  const logs = storageService.getStatusLogs(applicationNo);
  const logTbody = document.getElementById('detail-log-tbody');
  if (logTbody) {
    logTbody.innerHTML = logs.map(l => `
      <tr>
        <td style="font-size: 12px;">${l.timestamp}</td>
        <td>${renderStatusBadge(l.newStatus)}</td>
        <td style="font-size: 12px;">${l.note || '-'}</td>
        <td style="font-size: 12px;">${l.changedBy}</td>
      </tr>
    `).join('') || '<tr><td colspan="4" style="text-align:center;">ยังไม่มีประวัติ</td></tr>';
  }

  // กำหนดสถานะและหมายเหตุปัจจุบัน
  document.getElementById('modal-status-select').value = applicant.status;
  document.getElementById('modal-status-note').value = applicant.staffNote || '';

  // ปุ่มบันทึกการเปลี่ยนสถานะ
  const saveBtn = document.getElementById('btn-save-modal-status');
  saveBtn.onclick = async () => {
    const newStatus = document.getElementById('modal-status-select').value;
    const note = document.getElementById('modal-status-note').value;
    const session = storageService.getStaffSession();

    saveBtn.disabled = true;
    saveBtn.textContent = 'กำลังบันทึก...';

    const res = await storageService.updateStatus(applicationNo, newStatus, note, session);
    alert(res.message);
    saveBtn.disabled = false;
    saveBtn.textContent = 'บันทึกการเปลี่ยนสถานะ';
    modal.classList.remove('active');
    renderApplicantsTable();
    renderDashboardStats();
  };

  // ส่วนบันทึกการมอบตัว
  const enrollSection = document.getElementById('modal-enroll-section');
  if (applicant.status === 'ผ่านการคัดเลือก' || applicant.status === 'มอบตัวแล้ว') {
    enrollSection.style.display = 'block';
    const enrollBtn = document.getElementById('btn-enroll-action');
    if (applicant.studentId) {
      document.getElementById('modal-enroll-status-text').innerHTML = `<strong>รหัสนักศึกษา:</strong> ${applicant.studentId} (มอบตัวแล้ว)`;
      enrollBtn.style.display = 'none';
    } else {
      document.getElementById('modal-enroll-status-text').textContent = 'ผู้สมัครผ่านการคัดเลือก พร้อมสำหรับการบันทึกมอบตัว';
      enrollBtn.style.display = 'inline-block';
      enrollBtn.onclick = async () => {
        if (!confirm('ยืนยันการบันทึกมอบตัวและออกรหัสนักศึกษาอัตโนมัติ?')) return;
        const session = storageService.getStaffSession();
        const res = await storageService.enrollStudent(applicationNo, 'มอบตัวเรียบร้อยตามกำหนดการ', session);
        alert(`${res.message}\nรหัสนักศึกษาที่ออก: ${res.studentId}`);
        modal.classList.remove('active');
        renderApplicantsTable();
        renderDashboardStats();
      };
    }
  } else {
    enrollSection.style.display = 'none';
  }

  // ปุ่มพิมพ์ใบสมัครสำหรับเจ้าหน้าที่
  const printDocBtn = document.getElementById('btn-modal-print-doc');
  if (printDocBtn) {
    printDocBtn.onclick = () => printOfficialApplicationDoc(applicant);
  }

  modal.classList.add('active');
};

function getDocTypeName(type) {
  switch (type) {
    case 'PHOTO_1INCH': return 'รูปถ่าย 1 นิ้ว';
    case 'GPAX_TRANSCRIPT': return 'ระเบียนผลการเรียน (ปพ.1)';
    case 'CITIZEN_ID_CARD': return 'สำเนาบัตรประชาชน/ทะเบียนบ้าน';
    case 'CERTIFICATE': return 'เกียรติบัตร/ผลงาน';
    default: return 'เอกสารประกอบ';
  }
}

/**
 * ส่งออกข้อมูลผู้สมัครในรูปแบบ CSV ตามมาตรฐานงานทะเบียน (รองรับภาษาไทยสำหรับ Excel)
 */
function exportApplicantsCsv() {
  const applicants = storageService.getApplicantsLocal();
  if (applicants.length === 0) {
    alert('ไม่มีข้อมูลผู้สมัครสำหรับการส่งออก');
    return;
  }

  const headers = [
    "เลขที่ใบสมัคร", "รหัสนักศึกษา", "คำนำหน้า", "ชื่อ-สกุล", "เลขประจำตัวประชาชน",
    "ระดับที่สมัคร", "สาขาวิชาลำดับที่ 1", "สาขาวิชาลำดับที่ 2", "โรงเรียนเดิม",
    "จังหวัด", "เกรดเฉลี่ย (GPAX)", "เบอร์โทรศัพท์", "สถานะ", "หมายเหตุ", "วันเวลายื่นใบสมัคร"
  ];

  const rows = applicants.map(a => [
    a.applicationNo,
    a.studentId ? `="${a.studentId}"` : "",
    a.title,
    a.fullName,
    `="${a.nationalId}"`,
    a.level,
    a.branchOrder1,
    a.branchOrder2 || "",
    a.schoolName || "",
    a.addressProvince || "",
    a.gpax || "",
    `="${a.phone}"`,
    a.status,
    (a.staffNote || "").replace(/"/g, '""'),
    a.timestamp
  ]);

  let csvContent = "\uFEFF"; // UTF-8 BOM เพื่อให้ Excel ภาษาไทยเปิดได้ไม่เป็นภาษาต่างดาว
  csvContent += headers.join(",") + "\r\n";
  rows.forEach(r => {
    csvContent += r.map(field => `"${field}"`).join(",") + "\r\n";
  });

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `รายชื่อผู้สมัครโควตา_วท_ท่าหลวง_${new Date().toISOString().slice(0,10)}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

/**
 * หน้าตั้งค่าระบบ (Settings)
 */
function populateSettingsForm() {
  const config = storageService.getConfig();
  document.getElementById('setting-system-open').checked = config.systemOpen;
  document.getElementById('setting-start-date').value = config.startDate;
  document.getElementById('setting-end-date').value = config.endDate;
  document.getElementById('setting-announcement-title').value = config.announcementTitle;
  document.getElementById('setting-announcement-body').value = config.announcementBody;
  document.getElementById('setting-gas-url').value = config.gasApiUrl || '';
  document.getElementById('setting-pvc-branches').value = config.programsPvc.join('\n');
  document.getElementById('setting-pvs-branches').value = config.programsPvs.join('\n');
}

function handleSaveSettingsForm(e) {
  e.preventDefault();
  const pvcList = document.getElementById('setting-pvc-branches').value.split('\n').map(s => s.trim()).filter(Boolean);
  const pvsList = document.getElementById('setting-pvs-branches').value.split('\n').map(s => s.trim()).filter(Boolean);

  const updated = {
    systemOpen: document.getElementById('setting-system-open').checked,
    startDate: document.getElementById('setting-start-date').value,
    endDate: document.getElementById('setting-end-date').value,
    announcementTitle: document.getElementById('setting-announcement-title').value.trim(),
    announcementBody: document.getElementById('setting-announcement-body').value.trim(),
    gasApiUrl: document.getElementById('setting-gas-url').value.trim(),
    programsPvc: pvcList,
    programsPvs: pvsList
  };

  storageService.saveConfig(updated);
  alert('บันทึกการตั้งค่าระบบเรียบร้อยแล้ว');
  loadSystemSettings();
}

// ============================================================================
// การสร้างและพิมพ์ใบสมัครทางการ (A4 Printable Application)
// ============================================================================

/**
 * กรอกข้อมูลและเรียกการพิมพ์ใบสมัครทางการ A4 ตามแบบราชการ
 */
function printOfficialApplicationDoc(data) {
  const container = document.getElementById('official-print-form-container');
  if (!container) return;

  const thaiYear = toThaiNumerals(data.academicYear || '2570');
  const thaiAppNo = toThaiNumerals(data.applicationNo || '');
  const thaiNationalId = toThaiNumerals(data.nationalId || '');

  // รูปถ่าย
  const photoFile = data.files?.find(f => f.docType === 'PHOTO_1INCH');
  const photoHtml = (photoFile && photoFile.url && photoFile.url !== '#')
    ? `<img src="${photoFile.url}" style="width: 100%; height: 100%; object-fit: cover;">`
    : `<span>ติดรูปถ่าย<br>ขนาด ๑ นิ้ว</span>`;

  container.innerHTML = `
    <div class="a4-paper-sheet">
      <table class="doc-header-table">
        <tr>
          <td style="width: 80px;">
            <img src="assets/logo.png" style="width: 70px; height: 70px; object-fit: contain;">
          </td>
          <td style="text-align: center; vertical-align: middle;">
            <div class="doc-heading-title">ใบสมัครคัดเลือกเข้าศึกษาต่อ (ประเภทโควตา)</div>
            <div class="doc-subheading">วิทยาลัยเทคนิคท่าหลวงซิเมนต์ไทยอนุสรณ์ ประจำปีการศึกษา ${thaiYear}</div>
            <div style="font-size: 13px; font-weight: 600;">สังกัดสำนักงานคณะกรรมการการอาชีวศึกษา</div>
          </td>
          <td style="width: 110px;">
            <div class="doc-photo-box">${photoHtml}</div>
          </td>
        </tr>
      </table>

      <div style="display: flex; justify-content: space-between; margin-bottom: 10px; font-size: 13px;">
        <div><strong>ระดับที่สมัคร:</strong> <span class="doc-underlined">${data.level}</span></div>
        <div><strong>เลขที่ใบสมัคร:</strong> <span class="doc-underlined">${data.applicationNo}</span></div>
      </div>

      <div class="doc-section-title">ข้อที่ ๑ ข้อมูลผู้สมัคร</div>
      <div class="doc-data-row">
        ชื่อ - สกุล: <span class="doc-underlined" style="min-width: 220px; display: inline-block;">${data.title} ${data.fullName}</span>
        วัน/เดือน/ปีเกิด: <span class="doc-underlined">${data.birthDate}</span>
      </div>
      <div class="doc-data-row">
        เลขประจำตัวประชาชน (๑๓ หลัก): <span class="doc-underlined" style="letter-spacing: 2px; font-weight: 700;">${data.nationalId}</span>
      </div>

      <div class="doc-section-title">ข้อที่ ๒ ข้อมูลบิดา</div>
      <div class="doc-data-row">
        ชื่อบิดา: <span class="doc-underlined" style="min-width: 240px; display: inline-block;">${data.fatherName || '-'}</span>
        อายุ: <span class="doc-underlined">${data.fatherAge || '-'}</span> ปี
        อาชีพ: <span class="doc-underlined">${data.fatherJob || '-'}</span>
      </div>

      <div class="doc-section-title">ข้อที่ ๓ ข้อมูลมารดา</div>
      <div class="doc-data-row">
        ชื่อมารดา: <span class="doc-underlined" style="min-width: 240px; display: inline-block;">${data.motherName || '-'}</span>
        อายุ: <span class="doc-underlined">${data.motherAge || '-'}</span> ปี
        อาชีพ: <span class="doc-underlined">${data.motherJob || '-'}</span>
      </div>

      <div class="doc-section-title">ข้อที่ ๔ ที่อยู่ปัจจุบันที่สามารถติดต่อได้</div>
      <div class="doc-data-row">
        บ้านเลขที่: <span class="doc-underlined">${data.addressHouseNo}</span>
        หมู่ที่: <span class="doc-underlined">${data.addressMoo}</span>
        ซอย: <span class="doc-underlined">${data.addressSoi}</span>
        ถนน: <span class="doc-underlined">${data.addressRoad}</span>
      </div>
      <div class="doc-data-row">
        ตำบล/แขวง: <span class="doc-underlined">${data.addressSubdistrict}</span>
        อำเภอ/เขต: <span class="doc-underlined">${data.addressDistrict}</span>
        จังหวัด: <span class="doc-underlined">${data.addressProvince}</span>
        รหัสไปรษณีย์: <span class="doc-underlined">${data.addressPostalCode}</span>
      </div>
      <div class="doc-data-row">
        หมายเลขโทรศัพท์: <span class="doc-underlined">${data.phone}</span>
      </div>

      <div class="doc-section-title">ข้อที่ ๕ ข้อมูลการศึกษาเดิม</div>
      <div class="doc-data-row">
        ระดับชั้นเดิม: <span class="doc-underlined">${data.currentLevel || '-'}</span>
        สถานศึกษาเดิม: <span class="doc-underlined" style="min-width: 260px; display: inline-block;">${data.schoolName || '-'}</span>
      </div>
      <div class="doc-data-row">
        ที่ตั้งสถานศึกษา: <span class="doc-underlined">${data.schoolLocation || '-'}</span>
        ผลการเรียนเฉลี่ยสะสม (GPAX): <span class="doc-underlined" style="font-weight: 700;">${data.gpax || '-'}</span>
        ${data.oldMajor && data.oldMajor !== '-' ? `สาขาวิชาเดิม: <span class="doc-underlined">${data.oldMajor}</span>` : ''}
      </div>

      <div class="doc-section-title">ข้อที่ ๖ สาขาวิชาที่ประสงค์สมัครคัดเลือก</div>
      <div class="doc-data-row">
        สาขาวิชาลำดับที่ ๑: <span class="doc-underlined" style="font-weight: 700; min-width: 280px; display: inline-block;">${data.branchOrder1}</span>
      </div>
      ${data.branchOrder2 ? `
        <div class="doc-data-row">
          สาขาวิชาลำดับที่ ๒: <span class="doc-underlined" style="min-width: 280px; display: inline-block;">${data.branchOrder2}</span>
        </div>
      ` : ''}

      <div class="doc-section-title">หลักฐานประกอบการรับสมัครที่แนบส่ง</div>
      <table class="doc-evidence-table">
        <tr>
          <td style="width: 50%;">[ / ] ๑. รูปถ่ายหน้าตรงขนาด ๑ นิ้ว (แนบในระบบ)</td>
          <td style="width: 50%;">[ / ] ๒. เอกสารแสดงผลการเรียน ๕ ภาคเรียน (ปพ.๑)</td>
        </tr>
        <tr>
          <td>[ / ] ๓. สำเนาบัตรประชาชน หรือสำเนาทะเบียนบ้าน</td>
          <td>[ ${data.files?.some(f => f.docType === 'CERTIFICATE') ? '/' : ' '} ] ๔. สำเนาเกียรติบัตร/เอกสารรับรองผลงาน (ถ้ามี)</td>
        </tr>
      </table>

      <div class="doc-sign-block">
        <div class="doc-sign-col">
          <div>ขอรับรองว่าข้อความและเอกสารทั้งหมดถูกต้องเป็นความจริง</div>
          <div style="margin-top: 30px;">(ลงชื่อ)....................................................................ผู้สมัคร</div>
          <div>( ${data.title} ${data.fullName} )</div>
          <div>วันที่ยื่นสมัคร: ${data.timestamp ? data.timestamp.split(' ')[0] : '......./......./.......'}</div>
        </div>
        <div class="doc-sign-col" style="border: 1px solid #9CA3AF; padding: 10px; background: #F9FAFB;">
          <div style="font-weight: 700;">สำหรับเจ้าหน้าที่รับสมัครและทะเบียน</div>
          <div>ผลการตรวจหลักฐาน: [ / ] ครบถ้วนถูกต้อง  [  ] ไม่ครบถ้วน</div>
          <div style="margin-top: 20px;">(ลงชื่อ)....................................................................ผู้ตรวจรับ</div>
          <div>(....................................................................)</div>
          <div>เจ้าหน้าที่งานรับสมัคร วิทยาลัยเทคนิคท่าหลวงฯ</div>
        </div>
      </div>
    </div>
  `;

  window.print();
}

/**
 * ตัวช่วยแสดง Badge สถานะ
 */
function renderStatusBadge(status) {
  switch (status) {
    case 'รอตรวจสอบ':
      return `<span class="status-badge status-pending">รอตรวจสอบ</span>`;
    case 'เอกสารไม่ครบ':
      return `<span class="status-badge status-incomplete">เอกสารไม่ครบ</span>`;
    case 'ผ่านการคัดเลือก':
      return `<span class="status-badge status-approved">ผ่านการคัดเลือก</span>`;
    case 'ไม่ผ่าน':
      return `<span class="status-badge status-rejected">ไม่ผ่านการคัดเลือก</span>`;
    case 'มอบตัวแล้ว':
      return `<span class="status-badge status-enrolled">มอบตัวแล้ว</span>`;
    default:
      return `<span class="status-badge status-pending">${status || 'รอตรวจสอบ'}</span>`;
  }
}
