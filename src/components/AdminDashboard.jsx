import { useEffect, useRef, useState } from 'react';
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
  const [rlDate, setRlDate] = useState('');
  const [rlError, setRlError] = useState('');
  const rlRequestedRef = useRef(false); // state가 아니라 ref로: 이 값 때문에 effect가 다시 실행되면 안 되므로

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

  // "오늘 독서록 확인" 탭을 처음 열 때만 불러옴
  useEffect(() => {
    if (tab !== 'readingLog' || rlRequestedRef.current) return;
    rlRequestedRef.current = true;
    let cancelled = false;
    getReadingLogToday(studentId, password)
      .then((result) => {
        if (cancelled) return;
        if (result.success) {
          setRlStudents(result.students);
          setRlDate(result.date || '');
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
  }, [tab, studentId, password]);

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
            <h2>오늘 독서록 확인{rlDate ? ` (${rlDate})` : ''}</h2>
            {rlStudents && rlStudents.length > 0 && (
              <p>
                전체 {rlTotalCount}명 중 {rlDoneCount}명 기록 완료 · {rlTotalCount - rlDoneCount}명 미기록
              </p>
            )}
          </div>

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