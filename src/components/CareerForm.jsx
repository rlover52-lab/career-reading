import { useState } from 'react';
import { FORM_SECTIONS } from '../config';
import { saveData } from '../api';

export default function CareerForm({ studentId, studentName, onDone, onCancel }) {
  const [stepIndex, setStepIndex] = useState(0);
  const [values, setValues] = useState({});
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const section = FORM_SECTIONS[stepIndex];
  const isLastStep = stepIndex === FORM_SECTIONS.length - 1;

  function updateField(key, val) {
    setValues((prev) => ({ ...prev, [key]: val }));
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
