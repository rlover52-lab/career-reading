import { useEffect, useState } from 'react';
import { getAdminOverview } from '../api';

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
  const [students, setStudents] = useState(null);
  const [error, setError] = useState('');

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

  const submittedCount = students ? students.filter((s) => s.submitted).length : 0;
  const totalCount = students ? students.length : 0;
  const notSubmitted = students ? students.filter((s) => !s.submitted) : [];

  return (
    <div className="panel">
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
    </div>
  );
}
