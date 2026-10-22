// ============================================================
// 탐구 질문 다듬기 (2026-10-23 진로 수업용)
// 이 파일 내용을 Apps Script 편집기에 새 파일(inquiry.gs)로 붙여넣고,
// doPost의 action 분기에 아래 두 줄을 추가하세요.
//
//   if (action === 'saveInquiry') return jsonOut_(saveInquiry_(body));
//   if (action === 'getInquiry')  return jsonOut_(getInquiry_(body));
//
// (기존 코드가 switch문이면 case 'saveInquiry': / case 'getInquiry': 로 같은 식으로 추가)
// 그다음 [배포 > 배포 관리 > 연필(편집) > 버전: 새 버전 > 배포] — URL은 그대로 유지됩니다.
// ============================================================

const INQUIRY_SHEET_ID = '1lo-UDK6S6UofkxaFA4rQmTGsdIYvbJpnzbEbrBsVEcc'; // 진로독서2학기
const INQUIRY_TAB = '탐구질문';
const INQUIRY_HEADERS = [
  '타임스탬프', '학번', '이름', '책 제목', '처음 질문', '궁금해진 이유',
  '진로 연결', '다듬은 탐구 질문', '검색 키워드', '찾아볼 자료',
];

function inquirySheet_() {
  const ss = SpreadsheetApp.openById(INQUIRY_SHEET_ID);
  let sh = ss.getSheetByName(INQUIRY_TAB);
  if (!sh) {
    sh = ss.insertSheet(INQUIRY_TAB);
    sh.appendRow(INQUIRY_HEADERS);
    sh.setFrozenRows(1);
  }
  return sh;
}

function saveInquiry_(body) {
  const d = body.data || {};
  if (!body.studentId || !d.refinedQuestion) {
    return { success: false, message: '필수 항목이 비어 있습니다.' };
  }
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    inquirySheet_().appendRow([
      new Date(),
      String(body.studentId),
      body.studentName || '',
      d.bookTitle || '',
      d.originalQuestion || '',
      d.why || '',
      d.career || '',
      d.refinedQuestion || '',
      d.keywords || '',
      d.sources || '',
    ]);
  } finally {
    lock.releaseLock();
  }
  return { success: true };
}

function getInquiry_(body) {
  const sh = inquirySheet_();
  const values = sh.getDataRange().getValues().slice(1);
  const id = String(body.studentId);
  const records = values
    .filter((r) => String(r[1]) === id)
    .map((r) => ({
      timestamp: r[0] instanceof Date ? r[0].toISOString() : String(r[0]),
      bookTitle: r[3],
      originalQuestion: r[4],
      why: r[5],
      career: r[6],
      refinedQuestion: r[7],
      keywords: r[8],
      sources: r[9],
    }));
  return { success: true, records };
}

// 기존 코드에 JSON 응답 헬퍼가 이미 있다면 그걸 쓰고 이 함수는 지워도 됩니다.
function jsonOut_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
