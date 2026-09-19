import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AnimatePresence, motion } from 'framer-motion';
import UserRow from './UserRow';
import Spinner from './Spinner';
import { closeConnections, fetchConnections } from '../features/users/usersSlice';

export default function ConnectionsModal({ username }) {
  const dispatch = useDispatch();
  const { open, kind, users, loading } = useSelector((s) => s.users.connections);

  useEffect(() => {
    if (open && username) dispatch(fetchConnections({ username, kind }));
  }, [open, kind, username, dispatch]);

  // Escape closes the modal
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === 'Escape' && dispatch(closeConnections());
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, dispatch]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="modal__backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => dispatch(closeConnections())}
        >
          <motion.div
            className="modal"
            initial={{ opacity: 0, y: 20, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 380, damping: 32 }}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <header className="modal__head">
              <h2>{kind === 'followers' ? 'Followers' : 'Following'}</h2>
              <button className="modal__close" onClick={() => dispatch(closeConnections())}>
                ×
              </button>
            </header>

            <div className="modal__body userlist">
              {loading ? (
                <Spinner label="Loading people" />
              ) : users.length ? (
                users.map((u) => <UserRow key={u._id} user={u} />)
              ) : (
                <p className="muted-note">
                  {kind === 'followers' ? 'No followers yet.' : 'Not following anyone yet.'}
                </p>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
