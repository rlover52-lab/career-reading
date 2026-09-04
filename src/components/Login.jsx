import { useState } from 'react';
import { login } from '../api';

export default function Login({ onLoginSuccess }) {
  const [studentId, setStudentId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (!studentId.trim() || !password.trim()) {
      setError('학번과 비밀번호를 모두 입력해주세요.');
      return;
    }

    setLoading(true);
    try {
      const result = await login(studentId.trim(), password.trim());
      if (result.success) {
        onLoginSuccess({
          studentId: result.studentId,
          studentName: result.studentName,
          isAdmin: !!result.isAdmin,
          password: password.trim(),
        });
      } else {
        setError(result.message || '로그인에 실패했습니다.');
      }
    } catch (err) {
      setError('서버에 연결할 수 없습니다. 잠시 후 다시 시도해주세요.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-card">
      <h1>나의 진로 기록장</h1>
      <p className="subtitle">1학기 독서와 발표를 돌아보고, 2학기 진로 활동을 이어가 보세요.</p>

      <form onSubmit={handleSubmit}>
        <div className="field">
          <label htmlFor="studentId">학번</label>
          <input
            id="studentId"
            type="text"
            value={studentId}
            onChange={(e) => setStudentId(e.target.value)}
            autoComplete="username"
          />
        </div>
        <div className="field">
          <label htmlFor="password">비밀번호</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
          />
        </div>

        <button className="primary-btn" type="submit" disabled={loading}>
          {loading ? '확인 중...' : '로그인'}
        </button>

        {error && <p className="error-text">{error}</p>}
      </form>
    </div>
  );
}
