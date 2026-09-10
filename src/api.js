import { APPS_SCRIPT_URL } from './config';

async function callScript(payload) {
  const res = await fetch(APPS_SCRIPT_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    throw new Error('서버 요청에 실패했습니다.');
  }
  return res.json();
}

export function login(studentId, password) {
  return callScript({ action: 'login', studentId, password });
}

export function saveData(studentId, data) {
  return callScript({ action: 'saveData', studentId, data });
}

export function getData(studentId) {
  return callScript({ action: 'getData', studentId });
}

export function getAdminOverview(studentId, password) {
  return callScript({ action: 'adminOverview', studentId, password });
}

// 도서 확인: 텍스트(여러 줄/콤마로 여러 권 가능)를 그대로 보내서 도서관 소장 여부 검색
export function checkBooksText(text) {
  return callScript({ action: 'checkBooksText', text });
}

// 도서 확인: 도서관에 없는 책의 확정 제목/저자/출판사 저장 (upsert)
export function saveConfirmedBook(studentId, studentName, term, id, extractedTitle, extractedAuthor, title, author, publisher) {
  return callScript({
    action: 'saveConfirmedBook',
    studentId, studentName, term, id, extractedTitle, extractedAuthor, title, author, publisher,
  });
}

// 도서 확인: 이전에 저장해둔 확정 정보 불러오기 (같은 학생의 신청목록 행)
export function getMyConfirmedBooks(studentId) {
  return callScript({ action: 'getMyBooks', studentId });
}

// 저자·출판사 자동 검색 (카카오 도서 API)
export function searchBookMeta(title) {
  return callScript({ action: 'searchBookMeta', title });
}