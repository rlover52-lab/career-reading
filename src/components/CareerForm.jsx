import { useEffect, useState } from 'react';
import { FORM_SECTIONS } from '../config';
import { saveData, getData, checkBooksText } from '../api';

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
    try {
      const result = await checkBooksText(text);
      if (result.success) {
        setCheckResults((prev) => ({ ...prev, [key]: result.results || [] }));
      } else {
        setCheckError((prev) => ({ ...prev, [key]: result.message || '확인에 실패했습니다.' }));
      }
    } catch (err) {
      setCheckError((prev) => ({ ...prev, [key]: '서버에 연결할 수 없습니다.' }));
    } finally {
      setCheckingKey(null);
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
                  {checkResults[field.key].map((r, i) => (
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
                    </li>
                  ))}
                </ul>
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