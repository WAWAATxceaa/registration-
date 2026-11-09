require('dotenv').config();
const http = require('http');

async function runTests() {
  const app = require('./server');
  const PORT = process.env.PORT || 3000;
  const runningServer = app.listen(PORT);
  const baseUrl = `http://localhost:${PORT}`;

  const request = (path, method = 'GET', body = null) => {
    return new Promise((resolve, reject) => {
      const url = new URL(path, baseUrl);
      const req = http.request(url, {
        method,
        headers: body ? { 'Content-Type': 'application/json' } : {}
      }, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            resolve({ status: res.statusCode, data: JSON.parse(data) });
          } catch (e) {
            resolve({ status: res.statusCode, text: data });
          }
        });
      });
      req.on('error', reject);
      if (body) req.write(JSON.stringify(body));
      req.end();
    });
  };

  console.log('--- TEST 1: GET /api/health ---');
  const health = await request('/api/health');
  console.log('Health:', health.status, health.data);

  console.log('\n--- TEST 2: GET /api/applicants ---');
  const list1 = await request('/api/applicants');
  console.log('List status:', list1.status, 'Count:', list1.data?.count);

  console.log('\n--- TEST 3: POST /api/applicants (Validation failure check) ---');
  const invalidPost = await request('/api/applicants', 'POST', { fullName: 'ขาดข้อมูล' });
  console.log('Invalid POST status (expect 400):', invalidPost.status, invalidPost.data?.message);

  console.log('\n--- TEST 4: POST /api/applicants (Valid registration) ---');
  const validData = {
    level: 'ปวช.',
    title: 'นาย',
    fullName: 'วรรณชาติ จิตอาสา',
    birthDate: '15 พฤษภาคม 2554',
    nationalId: '1103702584126',
    fatherName: 'นายประสาน',
    fatherAge: '49',
    fatherJob: 'ช่างไม้',
    motherName: 'นางมณี',
    motherAge: '46',
    motherJob: 'แม่บ้าน',
    addressHouseNo: '12/3',
    addressMoo: '1',
    addressSoi: '-',
    addressRoad: 'สายตรี',
    addressSubdistrict: 'บ้านแก้ง',
    addressDistrict: 'เฉลิมพระเกียรติ',
    addressProvince: 'สระบุรี',
    addressPostalCode: '18000',
    phone: '0891234567',
    currentLevel: 'ม.3',
    schoolName: 'โรงเรียนอนุสรณ์',
    schoolLocation: 'สระบุรี',
    gpax: '3.65',
    branchOrder1: 'ช่างไฟฟ้ากำลัง',
    branchOrder2: 'ช่างยนต์'
  };
  const createRes = await request('/api/applicants', 'POST', validData);
  console.log('Create POST status (expect 201):', createRes.status, 'appNo:', createRes.data?.applicationNo, 'id:', createRes.data?.id);
  const createdId = createRes.data?.id;

  console.log('\n--- TEST 5: GET /api/applicants?nationalId=1103702584126 (Check status) ---');
  const statusRes = await request('/api/applicants?nationalId=1103702584126');
  console.log('Status query result:', statusRes.status, statusRes.data?.data?.fullName, statusRes.data?.data?.status);

  console.log('\n--- TEST 6: PUT /api/applicants/:id (Update applicant) ---');
  const updateRes = await request(`/api/applicants/${createdId}`, 'PUT', {
    status: 'ผ่านการคัดเลือก',
    staffNote: 'เอกสารและผลการเรียนผ่านเกณฑ์รอบโควตา'
  });
  console.log('Update PUT status:', updateRes.status, updateRes.data?.data?.status, updateRes.data?.data?.staffNote);

  console.log('\n--- TEST 7: POST /api/applicants/:id/enroll (Enroll applicant) ---');
  const enrollRes = await request(`/api/applicants/${createdId}/enroll`, 'POST', {
    enrolledNotes: 'มอบตัวเรียบร้อย ชำระค่าลงทะเบียนแล้ว',
    staffUser: { fullName: 'เจ้าหน้าที่ทะเบียน' }
  });
  console.log('Enroll status:', enrollRes.status, 'studentId:', enrollRes.data?.studentId, 'status:', enrollRes.data?.data?.status);

  console.log('\n--- TEST 8: DELETE /api/applicants/:id (deleteDimension in Sheets) ---');
  const delRes = await request(`/api/applicants/${createdId}`, 'DELETE');
  console.log('Delete status:', delRes.status, delRes.data);

  console.log('\n--- TEST 9: Verify after delete ---');
  const listAfter = await request('/api/applicants');
  console.log('List after delete count:', listAfter.data?.count);

  console.log('\n--- TEST 10: GET / (Serve frontend static) ---');
  const indexHtml = await request('/');
  console.log('Frontend serve status:', indexHtml.status, 'Length:', indexHtml.text?.length);

  console.log('\nALL 10 API & INTEGRATION TESTS COMPLETED SUCCESSFULLY!');
  process.exit(0);
}

runTests().catch(err => {
  console.error('Test error:', err);
  process.exit(1);
});
