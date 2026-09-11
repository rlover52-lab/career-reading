import { useEffect, useState } from 'react';
import { getAdminOverview, getReadingLogToday } from '../api';

function formatDate(value) {
  if (!value) return '-';
  const d = new Date(value);
  if (isNaN(d.getTime())) return String(value);
  return d.toLocaleString('ko-KR', {
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function AdminDashboard({ studentId, password }) {
  const [tab, setTab] = useState('submission'); // 'submission' | 'readingLog'

  const [students, setStudents] = useState(null);
  const [error, setError] = useState('');

  const [rlStudents, setRlStudents] = useState(null);
  const [rlDate, setRlDate] = useState(''); // 서버가 실제로 조회해준 날짜 (표시/드롭다운 값으로 사용)
  const [rlAvailableDates, setRlAvailableDates] = useState([]);
  const [selectedDate, setSelectedDate] = useState(''); // 사용자가 드롭다운에서 고른 날짜. ''면 "오늘"을 의미
  const [rlError, setRlError] = useState('');

  useEffect(() => {
    let cancelled = false;
    getAdminOverview(studentId, password)
      .then((result) => {
        if (cancelled) return;
        if (result.success) {
          setStudents(result.students);
        } else {
          setError(result.message || '현황을 불러오지 못했습니다.');
        }
      })
      .catch(() => {
        if (!cancelled) setError('서버에 연결할 수 없습니다.');
      });
    return () => {
      cancelled = true;
    };
  }, [studentId, password]);

  // "오늘 독서록 확인" 탭을 열 때, 그리고 드롭다운에서 날짜를 바꿀 때마다 다시 불러옴
  // (selectedDate는 사용자가 직접 고를 때만 바뀌고, 이 effect가 스스로 바꾸는 일은 없어야
  //  응답이 오기 전에 effect가 취소되는 문제가 안 생김)
  useEffect(() => {
    if (tab !== 'readingLog') return;
    let cancelled = false;
    setRlStudents(null);
    setRlError('');
    getReadingLogToday(studentId, password, selectedDate || undefined)
      .then((result) => {
        if (cancelled) return;
        if (result.success) {
          setRlStudents(result.students);
          setRlDate(result.date || '');
          setRlAvailableDates(result.availableDates || []);
        } else {
          setRlError(result.message || '현황을 불러오지 못했습니다.');
          setRlStudents([]);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setRlError('서버에 연결할 수 없습니다.');
          setRlStudents([]);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [tab, selectedDate, studentId, password]);

  const submittedCount = students ? students.filter((s) => s.submitted).length : 0;
  const totalCount = students ? students.length : 0;
  const notSubmitted = students ? students.filter((s) => !s.submitted) : [];

  const rlDoneCount = rlStudents ? rlStudents.filter((s) => s.done).length : 0;
  const rlTotalCount = rlStudents ? rlStudents.length : 0;

  return (
    <div className="panel">
      <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
        <button
          type="button"
          className="primary-btn"
          style={{
            width: 'auto',
            padding: '8px 16px',
            opacity: tab === 'submission' ? 1 : 0.5,
          }}
          onClick={() => setTab('submission')}
        >
          전체 제출 현황
        </button>
        <button
          type="button"
          className="primary-btn"
          style={{
            width: 'auto',
            padding: '8px 16px',
            opacity: tab === 'readingLog' ? 1 : 0.5,
          }}
          onClick={() => setTab('readingLog')}
        >
          오늘 독서록 확인
        </button>
      </div>

      {tab === 'submission' && (
        <>
          <div className="step-header">
            <h2>전체 제출 현황</h2>
            {students && (
              <p>
                전체 {totalCount}명 중 {submittedCount}명 제출 · {notSubmitted.length}명 미제출
              </p>
            )}
          </div>

          {error && <p className="error-text">{error}</p>}
          {students === null && !error && <div className="empty-state">불러오는 중...</div>}

          {students && students.length === 0 && (
            <div className="empty-state">학생DB 탭에 등록된 학생이 없어요.</div>
          )}

          {students && students.length > 0 && (
            <table className="admin-table">
              <thead>
                <tr>
                  <th>학번</th>
                  <th>이름</th>
                  <th>상태</th>
                  <th>제출 횟수</th>
                  <th>마지막 제출</th>
                </tr>
              </thead>
              <tbody>
                {students.map((s) => (
                  <tr key={s.studentId} className={s.submitted ? '' : 'row-pending'}>
                    <td>{s.studentId}</td>
                    <td>{s.studentName}</td>
                    <td>
                      <span className={s.submitted ? 'badge badge-done' : 'badge badge-pending'}>
                        {s.submitted ? '제출완료' : '미제출'}
                      </span>
                    </td>
                    <td>{s.submissionCount}</td>
                    <td>{formatDate(s.lastSubmitted)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </>
      )}

      {tab === 'readingLog' && (
        <>
          <div className="step-header">
            <h2>독서록 확인</h2>
            {rlStudents && rlStudents.length > 0 && (
              <p>
                {rlDate} 기준 · 전체 {rlTotalCount}명 중 {rlDoneCount}명 기록 완료 · {rlTotalCount - rlDoneCount}명 미기록
              </p>
            )}
          </div>

          {rlAvailableDates.length > 0 && (
            <div className="field" style={{ maxWidth: 220 }}>
              <label htmlFor="rl-date-select">날짜 선택</label>
              <select
                id="rl-date-select"
                value={selectedDate || rlDate}
                onChange={(e) => setSelectedDate(e.target.value)}
              >
                {rlAvailableDates.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>
          )}

          {rlError && <p className="error-text">{rlError}</p>}
          {rlStudents === null && !rlError && <div className="empty-state">불러오는 중...</div>}

          {rlStudents && rlStudents.length === 0 && !rlError && (
            <div className="empty-state">학생DB 탭에 등록된 학생이 없어요.</div>
          )}

          {rlStudents && rlStudents.length > 0 && (
            <table className="admin-table">
              <thead>
                <tr>
                  <th>학번</th>
                  <th>이름</th>
                  <th>상태</th>
                  <th>책 제목</th>
                  <th>기록 시간</th>
                </tr>
              </thead>
              <tbody>
                {rlStudents.map((s) => (
                  <tr key={s.studentId} className={s.done ? '' : 'row-pending'}>
                    <td>{s.studentId}</td>
                    <td>{s.studentName}</td>
                    <td>
                      <span className={s.done ? 'badge badge-done' : 'badge badge-pending'}>
                        {s.done ? '기록완료' : '미기록'}
                      </span>
                    </td>
                    <td>
                      {s.title || '-'}
                      {s.page !== '' && s.page !== undefined && s.page !== null ? ` (${s.page}p까지)` : ''}
                    </td>
                    <td>{formatDate(s.timestamp)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </>
      )}
    </div>
  );
}