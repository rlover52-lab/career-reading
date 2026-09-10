import { useEffect, useState } from 'react';
import { getData, checkBooksText, getMyConfirmedBooks, saveConfirmedBook, searchBookMeta } from '../api';

const TERM = '2학기';

export default function BookStatus({ studentId, studentName, onCancel }) {
  const [items, setItems] = useState(null); // [{ id, input, extractedTitle, extractedAuthor, statusLabel, detail, needsInput }]
  const [drafts, setDrafts] = useState({}); // id -> { title, author, publisher }
  const [confirmedMap, setConfirmedMap] = useState({}); // id -> true (이미 저장됨)
  const [savingId, setSavingId] = useState(null);
  const [savedId, setSavedId] = useState(null);
  const [searchingId, setSearchingId] = useState(null);
  const [metaResults, setMetaResults] = useState({});
  const [metaNotice, setMetaNotice] = useState({});
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const dataResult = await getData(studentId);
        if (cancelled) return;
        if (!dataResult.success) {
          setError(dataResult.message || '기록을 불러오지 못했습니다.');
          setItems([]);
          return;
        }

        const records = dataResult.records || [];
        if (records.length === 0) {
          setItems([]);
          return;
        }

        const latest = records.reduce((a, b) => {
          const aTime = new Date(a.timestamp).getTime() || 0;
          const bTime = new Date(b.timestamp).getTime() || 0;
          return bTime > aTime ? b : a;
        });

        const nextBooksText = latest.nextBooks || '';
        if (!nextBooksText.trim()) {
          setItems([]);
          return;
        }

        const [checkResult, confirmedResult] = await Promise.all([
          checkBooksText(nextBooksText),
          getMyConfirmedBooks(studentId).catch(() => ({ success: false, books: [] })),
        ]);
        if (cancelled) return;

        if (!checkResult.success) {
          setError(checkResult.message || '도서관 확인에 실패했습니다.');
          setItems([]);
          return;
        }

        const confirmedBooks = confirmedResult.success ? confirmedResult.books || [] : [];
        const confirmedById = {};
        confirmedBooks.forEach((b) => { confirmedById[b.id] = b; });

        const results = (checkResult.results || []).map((r, i) => {
          const id = `${studentId}_${TERM}_${i + 1}`;
          const needsInput = r.statusLabel.indexOf('소장 확인') === -1;
          return {
            id,
            input: r.input,
            extractedTitle: r.title,
            extractedAuthor: r.author,
            statusLabel: r.statusLabel,
            detail: r.detail,
            needsInput,
          };
        });

        const initialDrafts = {};
        const initialConfirmed = {};
        results.forEach((r) => {
          const prev = confirmedById[r.id];
          initialDrafts[r.id] = {
            title: (prev && prev.confirmedTitle) || r.extractedTitle || '',
            author: (prev && prev.confirmedAuthor) || r.extractedAuthor || '',
            publisher: (prev && prev.confirmedPublisher) || '',
          };
          if (prev && prev.confirmed) initialConfirmed[r.id] = true;
        });

        setItems(results);
        setDrafts(initialDrafts);
        setConfirmedMap(initialConfirmed);
      } catch (err) {
        if (!cancelled) setError('서버에 연결할 수 없습니다.');
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [studentId]);

  function updateDraft(id, key, value) {
    setDrafts((prev) => ({ ...prev, [id]: { ...prev[id], [key]: value } }));
  }

  async function handleSearchMeta(id) {
    const title = String((drafts[id] || {}).title || '').trim();
    if (!title) {
      setError('저자·출판사를 검색하려면 먼저 책 제목을 입력해주세요.');
      return;
    }
    setError('');
    setSearchingId(id);
    setMetaResults((prev) => ({ ...prev, [id]: [] }));
    setMetaNotice((prev) => ({ ...prev, [id]: '' }));
    try {
      const result = await searchBookMeta(title);
      if (result.success) {
        const results = result.results || [];
        if (results.length === 0) {
          setMetaNotice((prev) => ({ ...prev, [id]: '검색 결과가 없어요. 직접 입력해주세요.' }));
        } else {
          updateDraft(id, 'author', results[0].author);
          updateDraft(id, 'publisher', results[0].publisher);
          setMetaResults((prev) => ({ ...prev, [id]: results }));
        }
      } else {
        setMetaNotice((prev) => ({ ...prev, [id]: result.message || '검색에 실패했습니다.' }));
      }
    } catch (err) {
      setMetaNotice((prev) => ({ ...prev, [id]: '서버에 연결할 수 없습니다.' }));
    } finally {
      setSearchingId(null);
    }
  }

  function applyMetaCandidate(id, candidate) {
    updateDraft(id, 'title', candidate.title || drafts[id]?.title || '');
    updateDraft(id, 'author', candidate.author || '');
    updateDraft(id, 'publisher', candidate.publisher || '');
  }

  async function handleSave(item) {
    const draft = drafts[item.id] || {};
    if (!String(draft.title || '').trim()) {
      setError('책 제목을 입력해주세요.');
      return;
    }
    setError('');
    setSavingId(item.id);
    setSavedId(null);
    try {
      const result = await saveConfirmedBook(
        studentId,
        studentName,
        TERM,
        item.id,
        item.extractedTitle,
        item.extractedAuthor,
        draft.title.trim(),
        (draft.author || '').trim(),
        (draft.publisher || '').trim()
      );
      if (result.success) {
        setConfirmedMap((prev) => ({ ...prev, [item.id]: true }));
        setSavedId(item.id);
      } else {
        setError(result.message || '저장에 실패했습니다.');
      }
    } catch (err) {
      setError('서버에 연결할 수 없습니다. 잠시 후 다시 시도해주세요.');
    } finally {
      setSavingId(null);
    }
  }

  return (
    <div className="panel">
      <button className="back-link" onClick={onCancel}>
        ← 메뉴로 돌아가기
      </button>

      <div className="step-header">
        <h2>나의 도서 현황</h2>
        <p>
          "2학기에 읽고 싶은 책"에 적어주신 내용을 학교 도서관에서 바로 검색한 결과예요. 도서관에
          없는 책은 정확한 제목·저자·출판사를 입력해두면 도움이 됩니다.
        </p>
      </div>

      {error && <p className="error-text">{error}</p>}

      {items === null && !error && <div className="empty-state">불러오는 중...</div>}

      {items !== null && items.length === 0 && !error && (
        <div className="empty-state">
          아직 "2학기에 읽고 싶은 책"을 작성하지 않았어요. 먼저 진로 기록을 작성해주세요.
        </div>
      )}

      {items &&
        items.map((item) => {
          const draft = drafts[item.id] || { title: '', author: '', publisher: '' };
          const confirmed = !!confirmedMap[item.id];

          if (!item.needsInput) {
            return (
              <div className="record-card" key={item.id}>
                <div className="record-date">
                  {item.extractedTitle}
                  {item.extractedAuthor ? ` (${item.extractedAuthor})` : ''}
                  <span className="badge badge-done" style={{ marginLeft: 8 }}>도서관에 있음</span>
                </div>
                {item.detail && (
                  <p style={{ margin: 0, fontSize: 13, color: '#5b5546', whiteSpace: 'pre-wrap' }}>{item.detail}</p>
                )}
              </div>
            );
          }

          return (
            <div className="record-card" key={item.id}>
              <div className="record-date">
                {item.input}
                {confirmed ? (
                  <span className="badge badge-done" style={{ marginLeft: 8 }}>확인 완료</span>
                ) : (
                  <span className="badge badge-pending" style={{ marginLeft: 8 }}>학교 도서관에 없음 — 정보 확인 필요</span>
                )}
              </div>

              <div className="field">
                <label htmlFor={`title-${item.id}`}>책 제목</label>
                <input
                  id={`title-${item.id}`}
                  type="text"
                  value={draft.title}
                  onChange={(e) => updateDraft(item.id, 'title', e.target.value)}
                />
              </div>

              <button
                type="button"
                className="ghost-btn"
                style={{ marginBottom: 16 }}
                onClick={() => handleSearchMeta(item.id)}
                disabled={searchingId === item.id}
              >
                {searchingId === item.id ? '검색 중...' : '저자·출판사 자동 검색'}
              </button>
              {metaNotice[item.id] && (
                <p style={{ margin: '-10px 0 16px', fontSize: 13, color: '#5b5546' }}>{metaNotice[item.id]}</p>
              )}

              <div className="field">
                <label htmlFor={`author-${item.id}`}>저자</label>
                <input
                  id={`author-${item.id}`}
                  type="text"
                  value={draft.author}
                  onChange={(e) => updateDraft(item.id, 'author', e.target.value)}
                />
              </div>
              <div className="field">
                <label htmlFor={`publisher-${item.id}`}>출판사</label>
                <input
                  id={`publisher-${item.id}`}
                  type="text"
                  value={draft.publisher}
                  onChange={(e) => updateDraft(item.id, 'publisher', e.target.value)}
                />
              </div>

              {metaResults[item.id] && metaResults[item.id].length > 1 && (
                <div style={{ marginBottom: 16 }}>
                  <p style={{ fontSize: 12, color: '#5b5546', margin: '0 0 6px' }}>
                    비슷한 책이 여러 권 검색됐어요. 맞는 걸 골라주세요:
                  </p>
                  {metaResults[item.id].map((cand, i) => (
                    <button
                      type="button"
                      key={i}
                      className="ghost-btn"
                      style={{ display: 'block', textAlign: 'left', fontSize: 13, marginBottom: 4 }}
                      onClick={() => applyMetaCandidate(item.id, cand)}
                    >
                      {cand.title} — {cand.author} ({cand.publisher})
                    </button>
                  ))}
                </div>
              )}

              <button
                className="primary-btn"
                style={{ width: 'auto', padding: '10px 24px' }}
                onClick={() => handleSave(item)}
                disabled={savingId === item.id}
              >
                {savingId === item.id ? '저장 중...' : '정보 저장'}
              </button>
              {savedId === item.id && (
                <span style={{ marginLeft: 12, fontSize: 13, color: 'var(--sage-dark)' }}>저장됐어요.</span>
              )}
            </div>
          );
        })}
    </div>
  );
}