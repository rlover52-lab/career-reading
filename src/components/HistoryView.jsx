import { useEffect, useState } from 'react';
import { getData } from '../api';
import { FORM_SECTIONS } from '../config';

const FIELD_LABELS = FORM_SECTIONS.flatMap((s) => s.fields).reduce((acc, f) => {
  acc[f.key] = f.label;
  return acc;
}, {});

function formatDate(value) {
  const d = new Date(value);
  if (isNaN(d.getTime())) return String(value);
  return d.toLocaleString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function HistoryView({ studentId, onCancel }) {
  const [records, setRecords] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    getData(studentId)
      .then((result) => {
        if (cancelled) return;
        if (result.success) {
          setRecords(result.records);
        } else {
          setError(result.message || '기록을 불러오지 못했습니다.');
        }
      })
      .catch(() => {
        if (!cancelled) setError('서버에 연결할 수 없습니다.');
      });
    return () => {
      cancelled = true;
    };
  }, [studentId]);

  return (
    <div className="panel">
      <button className="back-link" onClick={onCancel}>
        ← 메뉴로 돌아가기
      </button>

      <div className="step-header">
        <h2>나의 기록 이력</h2>
        <p>지금까지 제출한 내용을 최신순으로 볼 수 있어요.</p>
      </div>

      {error && <p className="error-text">{error}</p>}

      {records === null && !error && <div className="empty-state">불러오는 중...</div>}

      {records !== null && records.length === 0 && (
        <div className="empty-state">아직 제출한 기록이 없어요. 첫 기록을 작성해보세요.</div>
      )}

      {records &&
        records.map((record, idx) => (
          <div className="record-card" key={idx}>
            <div className="record-date">{formatDate(record.timestamp)}</div>
            <dl>
              {Object.entries(FIELD_LABELS).map(([key, label]) => {
                const val = record[key];
                if (!val) return null;
                return (
                  <div key={key}>
                    <dt>{label}</dt>
                    <dd>{val}</dd>
                  </div>
                );
              })}
            </dl>
          </div>
        ))}
    </div>
  );
}
