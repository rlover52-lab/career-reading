import { useEffect, useState } from 'react';
import { saveReadingLog, getReadingLog } from '../api';

const RATINGS = [1, 2, 3, 4, 5];

function formatDate(value) {
  const d = new Date(value);
  if (isNaN(d.getTime())) return String(value);
  return d.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'short' });
}

function todayLabel() {
  return new Date().toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'short' });
}

export default function ReadingLog({ studentId, studentName, onCancel }) {
  const [records, setRecords] = useState(null); // 오래된 순
  const [loadError, setLoadError] = useState('');

  const [title, setTitle] = useState('');
  const [page, setPage] = useState('');
  const [impression, setImpression] = useState('');
  const [quote, setQuote] = useState('');
  const [question, setQuestion] = useState('');
  const [rating, setRating] = useState(0);

  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getReadingLog(studentId)
      .then((result) => {
        if (cancelled) return;
        if (result.success) {
          const recs = result.records || [];
          setRecords(recs);
          if (recs.length > 0) {
            setTitle(recs[recs.length - 1].title || '');
          }
        } else {
          setLoadError(result.message || '기록을 불러오지 못했습니다.');
          setRecords([]);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setLoadError('서버에 연결할 수 없습니다.');
          setRecords([]);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [studentId]);

  const lastRecord = records && records.length > 0 ? records[records.length - 1] : null;
  const pageNum = Number(page);
  const showDiff =
    lastRecord &&
    lastRecord.title === title.trim() &&
    page !== '' &&
    !isNaN(pageNum) &&
    pageNum - Number(lastRecord.page || 0) > 0;

  async function handleSubmit() {
    if (!title.trim()) {
      setError('책 제목을 입력해주세요.');
      return;
    }
    if (page === '' || isNaN(pageNum) || pageNum < 0) {
      setError('읽은 페이지를 숫자로 입력해주세요.');
      return;
    }
    if (!impression.trim()) {
      setError('오늘의 감상을 입력해주세요.');
      return;
    }
    setError('');
    setSubmitting(true);
    setSaved(false);
    try {
      const result = await saveReadingLog(studentId, studentName, {
        title: title.trim(),
        page: pageNum,
        impression: impression.trim(),
        quote: quote.trim(),
        question: question.trim(),
        rating: rating || '',
      });
      if (result.success) {
        const savedTitle = title.trim();
        const newRecord = {
          timestamp: new Date().toISOString(),
          date: new Date().toISOString().slice(0, 10),
          title: savedTitle,
          page: pageNum,
          impression: impression.trim(),
          quote: quote.trim(),
          question: question.trim(),
          rating: rating || '',
        };
        setRecords((prev) => [...(prev || []), newRecord]);
        setTitle(savedTitle);
        setPage('');
        setImpression('');
        setQuote('');
        setQuestion('');
        setRating(0);
        setSaved(true);
      } else {
        setError(result.message || '저장에 실패했습니다.');
      }
    } catch (err) {
      setError('서버에 연결할 수 없습니다. 잠시 후 다시 시도해주세요.');
    } finally {
      setSubmitting(false);
    }
  }

  const displayRecords = records ? [...records].reverse() : null; // 최신순

  return (
    <div className="panel">
      <button className="back-link" onClick={onCancel}>
        ← 메뉴로 돌아가기
      </button>

      <div className="step-header">
        <h2>독서록</h2>
        <p>일주일에 한 번, 읽고 있는 책에 대해 간단히 기록해보세요.</p>
      </div>

      <div className="field">
        <label>날짜</label>
        <input type="text" value={todayLabel()} disabled />
      </div>

      <div className="field">
        <label htmlFor="rl-title">책 제목</label>
        <input id="rl-title" type="text" value={title} onChange={(e) => setTitle(e.target.value)} />
      </div>

      <div className="field">
        <label htmlFor="rl-page">오늘까지 읽은 페이지</label>
        <input
          id="rl-page"
          type="text"
          inputMode="numeric"
          value={page}
          onChange={(e) => setPage(e.target.value.replace(/[^0-9]/g, ''))}
        />
        {showDiff && (
          <p style={{ margin: '6px 0 0', fontSize: 12, color: 'var(--sage-dark)' }}>
            지난 기록({lastRecord.page}p)보다 {pageNum - Number(lastRecord.page || 0)}쪽 더 읽었어요.
          </p>
        )}
      </div>

      <div className="field">
        <label htmlFor="rl-impression">오늘의 감상</label>
        <textarea id="rl-impression" value={impression} onChange={(e) => setImpression(e.target.value)} />
      </div>

      <div className="field">
        <label htmlFor="rl-quote">인상 깊은 문장/구절 (선택)</label>
        <textarea id="rl-quote" value={quote} onChange={(e) => setQuote(e.target.value)} />
      </div>

      <div className="field">
        <label htmlFor="rl-question">궁금한 점/질문 (선택)</label>
        <textarea id="rl-question" value={question} onChange={(e) => setQuestion(e.target.value)} />
      </div>

      <div className="field">
        <label>오늘 읽은 부분, 재미있었나요? (선택)</label>
        <div className="radio-group">
          {RATINGS.map((n) => (
            <label key={n}>
              <input type="radio" name="rl-rating" checked={rating === n} onChange={() => setRating(n)} />
              {'★'.repeat(n)}
            </label>
          ))}
        </div>
      </div>

      {error && <p className="error-text">{error}</p>}

      <div className="step-nav">
        <span />
        <button className="primary-btn" onClick={handleSubmit} disabled={submitting}>
          {submitting ? '저장 중...' : '오늘 기록 저장하기'}
        </button>
      </div>
      {saved && <p style={{ fontSize: 13, color: 'var(--sage-dark)', marginTop: 8 }}>저장됐어요!</p>}

      <div className="step-header" style={{ marginTop: 40 }}>
        <h2>지난 기록</h2>
      </div>

      {loadError && <p className="error-text">{loadError}</p>}
      {displayRecords === null && !loadError && <div className="empty-state">불러오는 중...</div>}
      {displayRecords !== null && displayRecords.length === 0 && (
        <div className="empty-state">아직 기록이 없어요. 오늘 첫 기록을 남겨보세요.</div>
      )}
      {displayRecords &&
        displayRecords.map((r, idx) => (
          <div className="record-card" key={idx}>
            <div className="record-date">
              {formatDate(r.date || r.timestamp)} · {r.title}
              {r.page !== '' && r.page !== undefined && r.page !== null ? ` (${r.page}p까지)` : ''}
            </div>
            <dl>
              <div>
                <dt>오늘의 감상</dt>
                <dd>{r.impression}</dd>
              </div>
              {r.quote && (
                <div>
                  <dt>인상 깊은 문장/구절</dt>
                  <dd>{r.quote}</dd>
                </div>
              )}
              {r.question && (
                <div>
                  <dt>궁금한 점/질문</dt>
                  <dd>{r.question}</dd>
                </div>
              )}
              {r.rating ? (
                <div>
                  <dt>재미</dt>
                  <dd>{'★'.repeat(Number(r.rating))}</dd>
                </div>
              ) : null}
            </dl>
          </div>
        ))}
    </div>
  );
}