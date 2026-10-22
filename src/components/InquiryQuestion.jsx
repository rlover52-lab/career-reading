import { useEffect, useState } from 'react';
import { getReadingLog, saveInquiry, getInquiry } from '../api';

const SOURCE_OPTIONS = ['신문 기사', '논문·보고서', '통계 자료', '강연·다큐 영상', '다른 책'];

const CHECKS = [
  '검색 한 번으로 바로 답이 나오는 질문이 아니다.',
  '"왜?", "어떻게?", "~와 ~는 어떻게 다른가?" 같은 형태다.',
  '기사·자료를 찾아서 조사해볼 수 있다.',
  '내 진로(관심 분야)와 연결된다.',
];

const EXAMPLES = [
  { bad: '인공지능은 언제 처음 만들어졌을까?', good: '의료 현장에서 AI 진단이 틀렸을 때, 책임은 누구에게 있어야 할까?' },
  { bad: '루브르 박물관에는 작품이 몇 점 있을까?', good: '왕실 소장품이 공공 박물관이 되면서 미술 감상 문화는 어떻게 달라졌을까?' },
];

function formatDate(value) {
  const d = new Date(value);
  if (isNaN(d.getTime())) return String(value || '');
  return d.toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' });
}

export default function InquiryQuestion({ studentId, studentName, onCancel }) {
  const [step, setStep] = useState(1);
  const [logs, setLogs] = useState(null);
  const [saved, setSaved] = useState(null); // 이전에 저장한 탐구 질문들
  const [loadError, setLoadError] = useState('');

  const [bookTitle, setBookTitle] = useState('');
  const [originalQuestion, setOriginalQuestion] = useState('');
  const [why, setWhy] = useState('');
  const [career, setCareer] = useState('');
  const [refinedQuestion, setRefinedQuestion] = useState('');
  const [checks, setChecks] = useState(CHECKS.map(() => false));
  const [keywords, setKeywords] = useState('');
  const [sources, setSources] = useState([]);

  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    let cancelled = false;
    Promise.allSettled([getReadingLog(studentId), getInquiry(studentId)]).then(([logRes, inqRes]) => {
      if (cancelled) return;
      if (logRes.status === 'fulfilled' && logRes.value.success) {
        setLogs(logRes.value.records || []);
      } else {
        setLogs([]);
        setLoadError('독서록을 불러오지 못했어요. 질문을 직접 적어도 괜찮아요.');
      }
      if (inqRes.status === 'fulfilled' && inqRes.value.success) {
        const recs = inqRes.value.records || [];
        setSaved(recs);
        if (recs.length > 0) {
          const last = recs[recs.length - 1];
          setBookTitle(last.bookTitle || '');
          setOriginalQuestion(last.originalQuestion || '');
          setWhy(last.why || '');
          setCareer(last.career || '');
          setRefinedQuestion(last.refinedQuestion || '');
          setKeywords(last.keywords || '');
          setSources(last.sources ? String(last.sources).split(',').map((s) => s.trim()).filter(Boolean) : []);
        }
      } else {
        setSaved([]);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [studentId]);

  // 독서록 중 질문·인상 깊은 구절이 있는 기록만 최신순으로
  const candidates = (logs || []).filter((r) => r.question || r.quote).slice().reverse();

  function pick(r) {
    setBookTitle(r.title || '');
    setOriginalQuestion(r.question || '');
    if (!r.question && r.quote) {
      setWhy(`인상 깊었던 구절: "${r.quote}"`);
    }
    setStep(2);
  }

  function toggleSource(s) {
    setSources((prev) => (prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]));
  }

  function goStep3() {
    if (!originalQuestion.trim()) {
      setError('처음 질문을 적어주세요.');
      return;
    }
    if (!why.trim()) {
      setError('이 질문이 궁금해진 이유를 적어주세요.');
      return;
    }
    setError('');
    setStep(3);
  }

  async function handleSubmit() {
    if (!refinedQuestion.trim()) {
      setError('다듬은 탐구 질문을 적어주세요.');
      return;
    }
    if (!keywords.trim()) {
      setError('검색 키워드를 적어주세요.');
      return;
    }
    setError('');
    setSubmitting(true);
    const data = {
      bookTitle: bookTitle.trim(),
      originalQuestion: originalQuestion.trim(),
      why: why.trim(),
      career: career.trim(),
      refinedQuestion: refinedQuestion.trim(),
      keywords: keywords.trim(),
      sources: sources.join(', '),
    };
    try {
      const result = await saveInquiry(studentId, studentName, data);
      if (result.success) {
        setSaved((prev) => [...(prev || []), { ...data, timestamp: new Date().toISOString() }]);
        setDone(true);
      } else {
        setError(result.message || '저장에 실패했습니다.');
      }
    } catch {
      setError('서버에 연결할 수 없습니다. 잠시 후 다시 시도해주세요.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="panel">
      <button className="back-link" onClick={onCancel}>
        ← 메뉴로 돌아가기
      </button>

      <div className="step-progress">
        <span className={step === 1 ? 'active' : ''}>1. 질문 고르기</span>
        <span className={step === 2 ? 'active' : ''}>2. 질문 살펴보기</span>
        <span className={step === 3 ? 'active' : ''}>3. 탐구 질문 완성</span>
      </div>

      {step === 1 && (
        <>
          <div className="step-header">
            <div className="step-number">STEP 1</div>
            <h2>독서록에서 질문 고르기</h2>
            <p>그동안 독서록에 적은 질문과 인상 깊은 구절이에요. 더 알아보고 싶은 것 하나를 골라보세요.</p>
          </div>

          {saved && saved.length > 0 && (
            <div className="record-card">
              <div className="record-date">지난번에 저장한 탐구 질문</div>
              <p style={{ margin: '0 0 10px', fontSize: 15 }}>{saved[saved.length - 1].refinedQuestion}</p>
              <button className="primary-btn" onClick={() => setStep(3)}>
                이어서 고치기
              </button>
            </div>
          )}

          {loadError && <p className="error-text">{loadError}</p>}
          {logs === null && <div className="empty-state">독서록 불러오는 중...</div>}
          {logs !== null && candidates.length === 0 && (
            <div className="empty-state">독서록에 적은 질문이 없어요. 아래에서 직접 적어보세요.</div>
          )}
          {candidates.map((r, idx) => (
            <div className="record-card" key={idx}>
              <div className="record-date">
                {formatDate(r.date || r.timestamp)} · {r.title}
              </div>
              <dl>
                {r.question && (
                  <div>
                    <dt>궁금한 점</dt>
                    <dd>{r.question}</dd>
                  </div>
                )}
                {r.quote && (
                  <div>
                    <dt>인상 깊은 구절</dt>
                    <dd>{r.quote}</dd>
                  </div>
                )}
              </dl>
              <button className="primary-btn" style={{ marginTop: 10 }} onClick={() => pick(r)}>
                이걸로 할래요
              </button>
            </div>
          ))}

          <div className="step-nav">
            <span />
            <button
              className="ghost-btn"
              onClick={() => {
                setOriginalQuestion('');
                setStep(2);
              }}
            >
              질문 직접 쓰기 →
            </button>
          </div>
        </>
      )}

      {step === 2 && (
        <>
          <div className="step-header">
            <div className="step-number">STEP 2</div>
            <h2>질문 살펴보기</h2>
            <p>고른 질문이 어디서 나왔는지, 내 진로와 어떻게 이어지는지 적어보세요.</p>
          </div>

          <div className="field">
            <label htmlFor="iq-book">책 제목</label>
            <input id="iq-book" type="text" value={bookTitle} onChange={(e) => setBookTitle(e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="iq-orig">처음 질문</label>
            <textarea id="iq-orig" value={originalQuestion} onChange={(e) => setOriginalQuestion(e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="iq-why">이 질문이 궁금해진 이유 (책의 어떤 내용 때문이었나요?)</label>
            <textarea id="iq-why" value={why} onChange={(e) => setWhy(e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="iq-career">내 희망 진로·관심 분야와 어떻게 연결되나요? (선택)</label>
            <textarea id="iq-career" value={career} onChange={(e) => setCareer(e.target.value)} />
          </div>

          {error && <p className="error-text">{error}</p>}
          <div className="step-nav">
            <button className="ghost-btn" onClick={() => setStep(1)}>
              ← 이전
            </button>
            <button className="primary-btn" onClick={goStep3}>
              다음
            </button>
          </div>
        </>
      )}

      {step === 3 && !done && (
        <>
          <div className="step-header">
            <div className="step-number">STEP 3</div>
            <h2>탐구 질문으로 다듬기</h2>
            <p>처음 질문을 "조사해서 답을 찾아볼 만한 질문"으로 바꿔보세요.</p>
          </div>

          <div className="record-card">
            <div className="record-date">이렇게 바꿔봐요</div>
            <dl>
              {EXAMPLES.map((ex, i) => (
                <div key={i}>
                  <dt>✕ {ex.bad}</dt>
                  <dd>○ {ex.good}</dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="field">
            <label>처음 질문</label>
            <input type="text" value={originalQuestion} disabled />
          </div>
          <div className="field">
            <label htmlFor="iq-refined">다듬은 탐구 질문</label>
            <textarea id="iq-refined" value={refinedQuestion} onChange={(e) => setRefinedQuestion(e.target.value)} />
          </div>

          <div className="field">
            <label>내 탐구 질문 점검하기</label>
            <div className="radio-group" style={{ flexDirection: 'column', alignItems: 'flex-start' }}>
              {CHECKS.map((c, i) => (
                <label key={i}>
                  <input
                    type="checkbox"
                    checked={checks[i]}
                    onChange={() => setChecks((prev) => prev.map((v, j) => (j === i ? !v : v)))}
                  />
                  {c}
                </label>
              ))}
            </div>
            {checks.some((v) => !v) && refinedQuestion.trim() && (
              <p style={{ margin: '6px 0 0', fontSize: 12, color: 'var(--sage-dark)' }}>
                체크가 안 되는 항목이 있다면 질문을 한 번 더 고쳐보세요.
              </p>
            )}
          </div>

          <div className="field">
            <label htmlFor="iq-keywords">검색해볼 키워드 2~3개 (쉼표로 구분)</label>
            <input id="iq-keywords" type="text" value={keywords} onChange={(e) => setKeywords(e.target.value)} />
          </div>

          <div className="field">
            <label>찾아볼 자료 (여러 개 선택 가능)</label>
            <div className="radio-group">
              {SOURCE_OPTIONS.map((s) => (
                <label key={s}>
                  <input type="checkbox" checked={sources.includes(s)} onChange={() => toggleSource(s)} />
                  {s}
                </label>
              ))}
            </div>
          </div>

          {error && <p className="error-text">{error}</p>}
          <div className="step-nav">
            <button className="ghost-btn" onClick={() => setStep(2)}>
              ← 이전
            </button>
            <button className="primary-btn" onClick={handleSubmit} disabled={submitting}>
              {submitting ? '저장 중...' : '탐구 질문 저장하기'}
            </button>
          </div>
        </>
      )}

      {step === 3 && done && (
        <div className="record-card">
          <div className="record-date">저장됐어요!</div>
          <p style={{ margin: '0 0 6px', fontSize: 15 }}>{refinedQuestion}</p>
          <p style={{ margin: 0, fontSize: 13 }}>다음 시간에는 이 질문으로 자료를 찾아 탐구보고서를 써볼 거예요.</p>
          <div className="step-nav">
            <button className="ghost-btn" onClick={() => setDone(false)}>
              다시 고치기
            </button>
            <button className="primary-btn" onClick={onCancel}>
              메뉴로
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
