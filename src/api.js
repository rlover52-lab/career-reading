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

// 도서 현황: 학교 도서관에 없는 것으로 확인된, 내 책 목록 불러오기
export function getMyBooks(studentId) {
  return callScript({ action: 'getMyBooks', studentId });
}

// 도서 현황: 책 한 권의 제목/저자/출판사 정보를 확인·저장
export function confirmBook(studentId, id, title, author, publisher) {
  return callScript({ action: 'confirmBook', studentId, id, title, author, publisher });
}

// 도서 현황: 책 제목으로 저자/출판사 후보 자동 검색
export function searchBookMeta(title) {
  return callScript({ action: 'searchBookMeta', title });
}
//요기가 현재 끝 09101317