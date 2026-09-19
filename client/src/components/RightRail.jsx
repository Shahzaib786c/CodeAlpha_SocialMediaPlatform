import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AnimatePresence, motion } from 'framer-motion';
import UserRow from './UserRow';
import { searchUsers, clearSearch, fetchSuggestions } from '../features/users/usersSlice';

/** Search box + results. Shared by the right rail and the mobile search page. */
export function UserSearch({ autoFocus = false }) {
  const dispatch = useDispatch();
  const { search, searching } = useSelector((s) => s.users);
  const [query, setQuery] = useState('');

  useEffect(() => {
    const value = query.trim();
    if (!value) {
      dispatch(clearSearch());
      return;
    }
    // debounce: wait until typing pauses instead of firing per keystroke
    const timer = setTimeout(() => dispatch(searchUsers(value)), 300);
    return () => clearTimeout(timer);
  }, [query, dispatch]);

  return (
    <>
      <div className="searchbox">
        <input
          className="search"
          type="text"
          value={query}
          autoFocus={autoFocus}
          placeholder="Search by name or username"
          onChange={(e) => setQuery(e.target.value)}
        />
        <AnimatePresence>
          {query && (
            <motion.button
              className="search__clear"
              onClick={() => setQuery('')}
              initial={{ opacity: 0, scale: 0.7 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.7 }}
              aria-label="Clear search"
            >
              ×
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      <div className="userlist">
        <AnimatePresence mode="popLayout">
          {search.map((u) => (
            <UserRow key={u._id} user={u} />
          ))}
        </AnimatePresence>
        {query.trim() && !searching && search.length === 0 && (
          <p className="muted-note">No one matched “{query.trim()}”.</p>
        )}
      </div>
    </>
  );
}

export default function RightRail() {
  const dispatch = useDispatch();
  const suggestions = useSelector((s) => s.users.suggestions);

  useEffect(() => {
    dispatch(fetchSuggestions());
  }, [dispatch]);

  return (
    <aside className="side">
      <div className="panel">
        <h2 className="panel__title">Find people</h2>
        <UserSearch />
      </div>

      <div className="panel">
        <h2 className="panel__title">Who to follow</h2>
        <div className="userlist">
          <AnimatePresence mode="popLayout">
            {suggestions.map((u) => (
              <UserRow key={u._id} user={u} />
            ))}
          </AnimatePresence>
          {suggestions.length === 0 && (
            <p className="muted-note">You are following everyone here.</p>
          )}
        </div>
      </div>
    </aside>
  );
}
