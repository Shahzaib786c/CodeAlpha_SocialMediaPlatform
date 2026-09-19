import { useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { motion } from 'framer-motion';

import AuthPage from './pages/AuthPage';
import FeedPage from './pages/FeedPage';
import ExplorePage from './pages/ExplorePage';
import ProfilePage from './pages/ProfilePage';
import SearchPage from './pages/SearchPage';

import Sidebar from './components/Sidebar';
import RightRail from './components/RightRail';
import Toaster from './components/Toast';
import Spinner from './components/Spinner';

import { loadSession } from './features/auth/authSlice';

/**
 * Page entrance animation.
 *
 * Deliberately no `exit` animation and no <AnimatePresence mode="wait">
 * around the router. With mode="wait" the incoming page is not mounted
 * until the outgoing one reports that its exit animation finished — and
 * a page containing its own nested AnimatePresence (comment threads, the
 * connections modal) can fail to report that. The result was a blank
 * content area when navigating away from a profile.
 *
 * Keying on the pathname makes this re-run on every navigation, so pages
 * still fade in, but a page can never be blocked from rendering.
 */
function Page({ children }) {
  const location = useLocation();
  return (
    <motion.div
      key={location.pathname}
      className="page"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: [0.2, 0.8, 0.3, 1] }}
    >
      {children}
    </motion.div>
  );
}

export default function App() {
  const dispatch = useDispatch();
  const location = useLocation();
  const { user, booted } = useSelector((s) => s.auth);

  useEffect(() => {
    dispatch(loadSession());
  }, [dispatch]);

  if (!booted) {
    return (
      <div className="boot">
        <Spinner label="Starting Echo" />
      </div>
    );
  }

  if (!user) {
    return (
      <>
        <AuthPage />
        <Toaster />
      </>
    );
  }

  return (
    <div className="app">
      <Sidebar />

      <main className="main">
        <Routes location={location}>
          <Route path="/" element={<Page><FeedPage /></Page>} />
          <Route path="/explore" element={<Page><ExplorePage /></Page>} />
          <Route path="/search" element={<Page><SearchPage /></Page>} />
          <Route path="/profile/:username" element={<Page><ProfilePage /></Page>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      <RightRail />
      <Toaster />
    </div>
  );
}
