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
