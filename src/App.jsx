import { useState, useCallback, Component } from 'react';
import { useAppContext } from './AppContext.jsx';
import ProfileSelection from './pages/ProfileSelection.jsx';
import Sidebar from './components/Sidebar.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Notes from './pages/Notes.jsx';
import Tasks from './pages/Tasks.jsx';
import Calendar from './pages/Calendar.jsx';
import StudyHub from './pages/StudyHub.jsx';
import Journal from './pages/Journal.jsx';
import SearchPage from './pages/SearchPage.jsx';
import Settings from './pages/Settings.jsx';
import Courses from './pages/Courses.jsx';
import Expenses from './pages/Expenses.jsx';
import Health from './pages/Health.jsx';
import PomodoroTimer from './pages/PomodoroTimer.jsx';
import CareerHub from './pages/CareerHub.jsx';
import NetworkHub from './pages/NetworkHub.jsx';
import SelfActualizationHub from './pages/SelfActualizationHub.jsx';

const PAGES = {
  dashboard: Dashboard,
  notes: Notes,
  tasks: Tasks,
  calendar: Calendar,
  study: StudyHub,
  journal: Journal,
  search: SearchPage,
  settings: Settings,
  courses: Courses,
  expenses: Expenses,
  health: Health,
  pomodoro: PomodoroTimer,
  career: CareerHub,
  network: NetworkHub,
  selfActualization: SelfActualizationHub,
};

/** Error Boundary — catches unhandled render errors and shows recovery UI */
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error('[ErrorBoundary] Uncaught error in React tree:', error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#0a0a0f', color: '#e8e8f0', fontFamily: 'Inter, sans-serif' }}>
          <div style={{ textAlign: 'center', maxWidth: '500px', padding: '40px' }}>
            <div style={{ fontSize: '3rem', marginBottom: '16px' }}>💥</div>
            <h2 style={{ marginBottom: '12px', fontSize: '1.3rem' }}>Đã xảy ra lỗi không mong muốn</h2>
            <p style={{ color: '#8888a0', marginBottom: '8px', fontSize: '0.85rem' }}>
              Ứng dụng gặp sự cố. Vui lòng thử tải lại trang.
            </p>
            <p style={{ color: '#ff6b6b', marginBottom: '24px', fontSize: '0.8rem', fontFamily: 'monospace', background: 'rgba(255,107,107,0.1)', padding: '12px', borderRadius: '8px', textAlign: 'left', overflowX: 'auto' }}>
              {this.state.error?.message || 'Unknown error'}
            </p>
            <button onClick={() => window.location.reload()} 
              style={{ padding: '10px 24px', background: '#6c5ce7', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '0.9rem' }}>
              🔄 Tải lại trang
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

function AppContent() {
  const { profile, setProfile, isLoading } = useAppContext();
  const [page, setPage] = useState('dashboard');
  const [searchQuery, setSearchQuery] = useState('');
  const [pageParams, setPageParams] = useState({});

  const navigate = useCallback((p, opts = {}) => {
    setPage(p);
    if (opts.search) setSearchQuery(opts.search);
    setPageParams(opts.params || {});
  }, []);

  if (isLoading) return null;

  if (!profile) {
    return <ProfileSelection onSelect={setProfile} />;
  }

  const Page = PAGES[page] || Dashboard;

  return (
    <>
      <Sidebar activePage={page} onNavigate={navigate} />
      <main className="main-content">
        <Page navigate={navigate} searchQuery={searchQuery} setSearchQuery={setSearchQuery} pageParams={pageParams} />
      </main>
    </>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <AppContent />
    </ErrorBoundary>
  );
}
