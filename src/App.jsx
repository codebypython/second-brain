import { useState, useCallback } from 'react';
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

const PAGES = {
  dashboard: Dashboard,
  notes: Notes,
  tasks: Tasks,
  calendar: Calendar,
  study: StudyHub,
  journal: Journal,
  search: SearchPage,
  settings: Settings,
};

export default function App() {
  const { profile, setProfile, isLoading } = useAppContext();
  const [page, setPage] = useState('dashboard');
  const [searchQuery, setSearchQuery] = useState('');

  const navigate = useCallback((p, opts = {}) => {
    setPage(p);
    if (opts.search) setSearchQuery(opts.search);
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
        <Page navigate={navigate} searchQuery={searchQuery} setSearchQuery={setSearchQuery} />
      </main>
    </>
  );
}
