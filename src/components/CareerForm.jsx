import { useEffect, useState } from 'react';
import { FORM_SECTIONS } from '../config';
import { saveData, getData, checkBooksText, searchBookMeta } from '../api';

const ALL_FIELD_KEYS = FORM_SECTIONS.flatMap((s) => s.fields).map((f) => f.key);

export default function CareerForm({ studentId, studentName, onCancel, onDone }) {
  const [stepIndex, setStepIndex] = useState(0);
  const [values, setValues] = useState({});
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [prefilled, setPrefilled] = useState(false);
  const [checkingKey, setCheckingKey] = useState(null);
  const [checkResults, setCheckResults] = useState({}); // key -> [{ input, title, author, statusLabel }]
  const [checkError, setCheckError] = useState({}); // key -> 에러 메시지
  const [metaResults, setMetaResults] = useState({}); // "key__i" -> { loading, results, error }

  const section = FORM_SECTIONS[stepIndex];
  const isLastStep = stepIndex === FORM_SECTIONS.length - 1;

  // 마지막으로 제출한 기록을 불러와 폼에 미리 채워둠 (수정할 부분만 고치면 되도록)
  useEffect(() => {
    let cancelled = false;
    getData(studentId)
      .then((result) => {
        if (cancelled || !result.success) return;
        const records = result.records || [];
        if (records.length === 0) return;

        const latest = records.reduce((a, b) => {
          const aTime = new Date(a.timestamp).getTime() || 0;
          const bTime = new Date(b.timestamp).getTime() || 0;
          return bTime > aTime ? b : a;
        });

        const carriedValues = {};
        ALL_FIELD_KEYS.forEach((key) => {
          if (latest[key]) carriedValues[key] = latest[key];
        });

        if (Object.keys(carriedValues).length > 0) {
          setValues(carriedValues);
          setPrefilled(true);
        }
      })
      .catch(() => {
        // 이전 기록을 못 불러와도 새 폼 작성엔 지장 없으므로 조용히 무시
      });
    return () => {
      cancelled = true;
    };
  }, [studentId]);

  function updateField(key, val) {
    setValues((prev) => ({ ...prev, [key]: val }));
  }

  function clearAll() {
    setValues({});
    setPrefilled(false);
  }

  async function handleCheckLibrary(key) {
    const text = String(values[key] || '').trim();
    if (!text) {
      setCheckError((prev) => ({ ...prev, [key]: '먼저 책 제목을 입력해주세요.' }));
      return;
    }
    setCheckError((prev) => ({ ...prev, [key]: '' }));
    setCheckingKey(key);
    // 이전 검색 결과(카카오 후보 포함)는 지우고 새로 시작
    setMetaResults((prev) => {
      const next = { ...prev };
      Object.keys(next).forEach((k) => {
        if (k.startsWith(`${key}__`)) delete next[k];
      });
      return next;
    });
    try {
      const result = await checkBooksText(text);
      if (result.success) {
        const results = result.results || [];
        setCheckResults((prev) => ({ ...prev, [key]: results }));
        // 도서관에서 확실히 확인되지 않은 책은 저자·출판사도 자동으로 같이 찾아서 보여줌
        results.forEach((r, i) => {
          if (r.statusLabel.indexOf('소장 확인') === -1) {
            fetchMetaFor(key, i, r.title);
          }
        });
      } else {
        setCheckError((prev) => ({ ...prev, [key]: result.message || '확인에 실패했습니다.' }));
      }
    } catch (err) {
      setCheckError((prev) => ({ ...prev, [key]: '서버에 연결할 수 없습니다.' }));
    } finally {
      setCheckingKey(null);
    }
  }

  async function fetchMetaFor(key, index, title) {
    const metaKey = `${key}__${index}`;
    setMetaResults((prev) => ({ ...prev, [metaKey]: { loading: true } }));
    try {
      const res = await searchBookMeta(title);
      if (res.success) {
        setMetaResults((prev) => ({ ...prev, [metaKey]: { loading: false, results: res.results || [] } }));
      } else {
        setMetaResults((prev) => ({ ...prev, [metaKey]: { loading: false, error: res.message || '검색에 실패했습니다.' } }));
      }
    } catch (err) {
      setMetaResults((prev) => ({ ...prev, [metaKey]: { loading: false, error: '서버에 연결할 수 없습니다.' } }));
    }
  }

  function validateStep() {
    for (const field of section.fields) {
      if (field.required && !String(values[field.key] || '').trim()) {
        return `"${field.label}" 항목을 입력해주세요.`;
      }
    }
    return '';
  }

  function goNext() {
    const validationError = validateStep();
    if (validationError) {
      setError(validationError);
      return;
    }
    setError('');
    setStepIndex((i) => i + 1);
  }

  function goBack() {
    setError('');
    setStepIndex((i) => Math.max(0, i - 1));
  }

  async function handleSubmit() {
    const validationError = validateStep();
    if (validationError) {
      setError(validationError);
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      const result = await saveData(studentId, { ...values, studentName });
      if (result.success) {
        onDone();
      } else {
        setError(result.message || '저장에 실패했습니다.');
      }
    } catch (err) {
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
        {FORM_SECTIONS.map((s, i) => (
          <span key={s.id} className={i <= stepIndex ? 'active' : ''} />
        ))}
      </div>

      <div className="step-header">
        <div className="step-number">
          {stepIndex + 1} / {FORM_SECTIONS.length}
        </div>
        <h2>{section.title}</h2>
        <p>{section.description}</p>
      </div>

      {stepIndex === 0 && prefilled && (
        <p style={{ fontSize: 13, color: 'var(--sage-dark)', marginTop: -12, marginBottom: 20 }}>
          지난번에 제출한 내용을 불러왔어요. 바뀐 부분만 고쳐서 제출하면 됩니다.{' '}
          <button
            type="button"
            className="back-link"
            style={{ display: 'inline', marginBottom: 0, fontSize: 13 }}
            onClick={clearAll}
          >
            비우고 새로 작성하기
          </button>
        </p>
      )}

      {section.fields.map((field) => (
        <div className="field" key={field.key}>
          <label htmlFor={field.key}>{field.label}</label>
          {field.type === 'textarea' && (
            <textarea
              id={field.key}
              value={values[field.key] || ''}
              onChange={(e) => updateField(field.key, e.target.value)}
            />
          )}

          {field.type === 'textarea' && field.librarySearchable && (
            <div style={{ marginTop: 8 }}>
              <button
                type="button"
                className="ghost-btn"
                onClick={() => handleCheckLibrary(field.key)}
                disabled={checkingKey === field.key}
              >
                {checkingKey === field.key ? '확인 중...' : '학교 도서관에 있는지 확인하기'}
              </button>

              {checkError[field.key] && (
                <p className="error-text" style={{ marginTop: 6 }}>{checkError[field.key]}</p>
              )}

              {checkResults[field.key] && checkResults[field.key].length > 0 && (
                <ul style={{ margin: '8px 0 0', paddingLeft: 18, fontSize: 13 }}>
                  {checkResults[field.key].map((r, i) => {
                    const needsAttention = r.statusLabel.indexOf('소장 확인') === -1;
                    const meta = metaResults[`${field.key}__${i}`];
                    return (
                      <li key={i} style={{ marginBottom: 8 }}>
                        <div>
                          입력한 내용: {r.title}
                          {r.author ? ` (${r.author})` : ''} — {r.statusLabel}
                        </div>
                        {r.detail && (
                          <div style={{ color: '#5b5546', whiteSpace: 'pre-wrap', marginTop: 2 }}>
                            찾은 책: {r.detail}
                          </div>
                        )}

                        {needsAttention && (
                          <div style={{ marginTop: 4 }}>
                            {meta?.loading && (
                              <span style={{ color: '#5b5546' }}>저자·출판사 자동 검색 중...</span>
                            )}
                            {meta?.error && <span style={{ color: '#5b5546' }}>{meta.error}</span>}
                            {meta?.results && meta.results.length === 0 && (
                              <span style={{ color: '#5b5546' }}>저자·출판사 검색 결과가 없어요.</span>
                            )}
                            {meta?.results && meta.results.length > 0 && (
                              <div>
                                <span style={{ color: '#5b5546' }}>저자·출판사 자동 검색 결과 (참고용):</span>
                                <ul style={{ margin: '4px 0 0', paddingLeft: 16 }}>
                                  {meta.results.slice(0, 3).map((cand, ci) => (
                                    <li key={ci}>
                                      {cand.title} — {cand.author} ({cand.publisher})
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        )}
                      </li>
                    );
                  })}
                </ul>
              )}
              {checkResults[field.key] && checkResults[field.key].some((r) => r.statusLabel.indexOf('소장 확인') === -1) && (
                <p style={{ margin: '6px 0 0', fontSize: 12, color: '#5b5546' }}>
                  도서관에 없거나 확인이 더 필요한 책은, 제출 후 "나의 도서 현황" 페이지에서 정확한 제목·저자·출판사를 최종 확인하고 저장할 수 있어요.
                </p>
              )}
            </div>
          )}
          {field.type === 'text' && (
            <input
              id={field.key}
              type="text"
              value={values[field.key] || ''}
              onChange={(e) => updateField(field.key, e.target.value)}
            />
          )}
          {field.type === 'radio' && (
            <div className="radio-group">
              {field.options.map((opt) => (
                <label key={opt}>
                  <input
                    type="radio"
                    name={field.key}
                    value={opt}
                    checked={values[field.key] === opt}
                    onChange={(e) => updateField(field.key, e.target.value)}
                  />
                  {opt}
                </label>
              ))}
            </div>
          )}
        </div>
      ))}

      {error && <p className="error-text">{error}</p>}

      <div className="step-nav">
        {stepIndex > 0 ? (
          <button className="ghost-btn" onClick={goBack}>
            이전
          </button>
        ) : (
          <span />
        )}

        {isLastStep ? (
          <button className="primary-btn" onClick={handleSubmit} disabled={submitting}>
            {submitting ? '저장 중...' : '제출하기'}
          </button>
        ) : (
          <button className="primary-btn" onClick={goNext}>
            다음
          </button>
        )}
      </div>
    </div>
  );
}