import { useState } from 'react';
import Login from './components/Login';
import CareerForm from './components/CareerForm';
import HistoryView from './components/HistoryView';
import BookStatus from './components/BookStatus';
import AdminDashboard from './components/AdminDashboard';

// view: 'menu' | 'form' | 'history' | 'books'
export default function App() {
  const [student, setStudent] = useState(null); // { studentId, studentName, isAdmin, password }
  const [view, setView] = useState('menu');
  const [justSubmitted, setJustSubmitted] = useState(false);

  function handleLogout() {
    setStudent(null);
    setView('menu');
    setJustSubmitted(false);
  }

  if (!student) {
    return (
      <div className="app-shell">
        <Login onLoginSuccess={setStudent} />
      </div>
    );
  }

  if (student.isAdmin) {
    return (
      <div className="app-shell">
        <div className="app-header">
          <span className="brand">나의 진로 기록장 · 관리자</span>
          <div>
            <span className="student-name">{student.studentName}님</span>{' '}
            <button className="logout-link" onClick={handleLogout}>
              로그아웃
            </button>
          </div>
        </div>
        <AdminDashboard studentId={student.studentId} password={student.password} />
      </div>
    );
  }

  return (
    <div className="app-shell">
      <div className="app-header">
        <span className="brand">나의 진로 기록장</span>
        <div>
          <span className="student-name">{student.studentName}님</span>{' '}
          <button className="logout-link" onClick={handleLogout}>
            로그아웃
          </button>
        </div>
      </div>

      {view === 'menu' && (
        <div className="panel menu-grid">
          {justSubmitted && (
            <div className="record-card">
              <div className="record-date">방금 저장됨</div>
              <p style={{ margin: 0, fontSize: 14 }}>기록이 잘 저장되었어요. 이력에서 확인할 수 있어요.</p>
            </div>
          )}

          <div className="menu-card">
            <h2>새 기록 작성하기</h2>
            <p>1학기 되돌아보기부터 2학기 계획까지, 순서대로 작성해보세요.</p>
            <button onClick={() => setView('form')}>작성 시작</button>
          </div>

          <div className="menu-card">
            <h2>나의 기록 이력 보기</h2>
            <p>지금까지 제출한 내용을 다시 불러와 확인할 수 있어요.</p>
            <button onClick={() => setView('history')}>이력 보기</button>
          </div>

          <div className="menu-card">
            <h2>나의 도서 현황</h2>
            <p>학교 도서관에서 아직 확인되지 않은 책이 있는지 보고, 정확한 정보를 입력해보세요.</p>
            <button onClick={() => setView('books')}>확인하러 가기</button>
          </div>
        </div>
      )}

      {view === 'form' && (
        <CareerForm
          studentId={student.studentId}
          studentName={student.studentName}
          onCancel={() => setView('menu')}
          onDone={() => {
            setJustSubmitted(true);
            setView('menu');
          }}
        />
      )}

      {view === 'history' && <HistoryView studentId={student.studentId} onCancel={() => setView('menu')} />}

      {view === 'books' && <BookStatus studentId={student.studentId} onCancel={() => setView('menu')} />}
    </div>
  );
}