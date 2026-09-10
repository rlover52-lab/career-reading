import { useEffect, useState } from 'react';
import { getMyBooks, confirmBook, searchBookMeta } from '../api';

export default function BookStatus({ studentId, onCancel }) {
  const [items, setItems] = useState(null); // 서버에서 불러온 원본 목록
  const [drafts, setDrafts] = useState({}); // id -> { title, author, publisher }
  const [savingId, setSavingId] = useState(null);
  const [savedId, setSavedId] = useState(null);
  const [searchingId, setSearchingId] = useState(null);
  const [metaResults, setMetaResults] = useState({}); // id -> [{ title, author, publisher }]
  const [metaNotice, setMetaNotice] = useState({}); // id -> 안내 문구
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    getMyBooks(studentId)
      .then((result) => {
        if (cancelled) return;
        if (result.success) {
          setItems(result.books || []);
          const initialDrafts = {};
          (result.books || []).forEach((b) => {
            initialDrafts[b.id] = {
              title: b.confirmedTitle || b.extractedTitle || '',
              author: b.confirmedAuthor || b.extractedAuthor || '',
              publisher: b.confirmedPublisher || '',
            };
          });
          setDrafts(initialDrafts);
        } else {
          setError(result.message || '목록을 불러오지 못했습니다.');
        }
      })
      .catch(() => {
        if (!cancelled) setError('서버에 연결할 수 없습니다.');
      });
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
          // 첫 번째 결과로 자동 채우고, 나머지는 후보로 보여줌
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

  async function handleSave(id) {
    const draft = drafts[id] || {};
    if (!String(draft.title || '').trim()) {
      setError('책 제목을 입력해주세요.');
      return;
    }
    setError('');
    setSavingId(id);
    setSavedId(null);
    try {
      const result = await confirmBook(
        studentId,
        id,
        draft.title.trim(),
        (draft.author || '').trim(),
        (draft.publisher || '').trim()
      );
      if (result.success) {
        setItems((prev) =>
          prev.map((b) => (b.id === id ? { ...b, confirmed: true } : b))
        );
        setSavedId(id);
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
          선생님이 학교 도서관에서 아직 확인하지 못한 책들이에요. 정확한 제목·저자·출판사를
          입력해두면 선생님이 확인하는 데 도움이 됩니다.
        </p>
      </div>

      {error && <p className="error-text">{error}</p>}

      {items === null && !error && <div className="empty-state">불러오는 중...</div>}

      {items !== null && items.length === 0 && (
        <div className="empty-state">확인이 필요한 책이 없어요. 모두 도서관에 있거나, 아직 정리되지 않았어요.</div>
      )}

      {items &&
        items.map((b) => {
          const draft = drafts[b.id] || { title: '', author: '', publisher: '' };
          return (
            <div className="record-card" key={b.id}>
              <div className="record-date">
                {b.term}
                {b.confirmed && <span className="badge badge-done" style={{ marginLeft: 8 }}>확인 완료</span>}
                {!b.confirmed && <span className="badge badge-pending" style={{ marginLeft: 8 }}>정보 확인 필요</span>}
              </div>

              {b.extractedTitle && (
                <p style={{ margin: '0 0 12px', fontSize: 13, color: '#5b5546' }}>
                  기존에 적어주신 내용: {b.extractedTitle}
                  {b.extractedAuthor ? ` (${b.extractedAuthor})` : ''}
                </p>
              )}

              <div className="field">
                <label htmlFor={`title-${b.id}`}>책 제목</label>
                <input
                  id={`title-${b.id}`}
                  type="text"
                  value={draft.title}
                  onChange={(e) => updateDraft(b.id, 'title', e.target.value)}
                />
              </div>

              <button
                type="button"
                className="ghost-btn"
                style={{ marginBottom: 16 }}
                onClick={() => handleSearchMeta(b.id)}
                disabled={searchingId === b.id}
              >
                {searchingId === b.id ? '검색 중...' : '저자·출판사 자동 검색'}
              </button>
              {metaNotice[b.id] && (
                <p style={{ margin: '-10px 0 16px', fontSize: 13, color: '#5b5546' }}>{metaNotice[b.id]}</p>
              )}

              <div className="field">
                <label htmlFor={`author-${b.id}`}>저자</label>
                <input
                  id={`author-${b.id}`}
                  type="text"
                  value={draft.author}
                  onChange={(e) => updateDraft(b.id, 'author', e.target.value)}
                />
              </div>
              <div className="field">
                <label htmlFor={`publisher-${b.id}`}>출판사</label>
                <input
                  id={`publisher-${b.id}`}
                  type="text"
                  value={draft.publisher}
                  onChange={(e) => updateDraft(b.id, 'publisher', e.target.value)}
                />
              </div>

              {metaResults[b.id] && metaResults[b.id].length > 1 && (
                <div style={{ marginBottom: 16 }}>
                  <p style={{ fontSize: 12, color: '#5b5546', margin: '0 0 6px' }}>
                    비슷한 책이 여러 권 검색됐어요. 맞는 걸 골라주세요:
                  </p>
                  {metaResults[b.id].map((cand, i) => (
                    <button
                      type="button"
                      key={i}
                      className="ghost-btn"
                      style={{ display: 'block', textAlign: 'left', fontSize: 13, marginBottom: 4 }}
                      onClick={() => applyMetaCandidate(b.id, cand)}
                    >
                      {cand.title} — {cand.author} ({cand.publisher})
                    </button>
                  ))}
                </div>
              )}

              <button
                className="primary-btn"
                style={{ width: 'auto', padding: '10px 24px' }}
                onClick={() => handleSave(b.id)}
                disabled={savingId === b.id}
              >
                {savingId === b.id ? '저장 중...' : '정보 저장'}
              </button>
              {savedId === b.id && (
                <span style={{ marginLeft: 12, fontSize: 13, color: 'var(--sage-dark)' }}>저장됐어요.</span>
              )}
            </div>
          );
        })}
    </div>
  );
}