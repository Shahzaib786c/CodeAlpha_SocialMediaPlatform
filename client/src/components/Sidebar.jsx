import { NavLink, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import Avatar from './Avatar';
import { logout } from '../features/auth/authSlice';
import { pushToast } from '../features/ui/uiSlice';

const LINKS = [
  { to: '/', label: 'Home', end: true },
  { to: '/explore', label: 'Explore' },
];

export default function Sidebar() {
  const me = useSelector((s) => s.auth.user);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const signOut = () => {
    dispatch(logout());
    dispatch(pushToast('Logged out'));
    navigate('/');
  };

  return (
    <>
      <aside className="rail">
        <h1 className="wordmark">Echo</h1>

        <nav className="nav">
          {LINKS.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.end}
              className={({ isActive }) => `nav__item ${isActive ? 'is-active' : ''}`}
            >
              {l.label}
            </NavLink>
          ))}
          <NavLink
            to={`/profile/${me?.username}`}
            className={({ isActive }) => `nav__item ${isActive ? 'is-active' : ''}`}
          >
            Profile
          </NavLink>
        </nav>

        <div className="rail__foot">
          <NavLink to={`/profile/${me?.username}`} className="me">
            <Avatar user={me} size="sm" />
            <div className="me__text">
              <div className="me__name">{me?.fullName}</div>
              <div className="me__handle">@{me?.username}</div>
            </div>
          </NavLink>
          <button className="btn btn--ghost btn--block" onClick={signOut}>
            Log out
          </button>
        </div>
      </aside>

      {/* Mobile tab bar */}
      <nav className="tabbar">
        {LINKS.map((l) => (
          <NavLink
            key={l.to}
            to={l.to}
            end={l.end}
            className={({ isActive }) => `tabbar__item ${isActive ? 'is-active' : ''}`}
          >
            {({ isActive }) => (
              <>
                {l.label}
                {isActive && <motion.span layoutId="tabdot" className="tabbar__dot" />}
              </>
            )}
          </NavLink>
        ))}
        <NavLink
          to="/search"
          className={({ isActive }) => `tabbar__item ${isActive ? 'is-active' : ''}`}
        >
          {({ isActive }) => (
            <>
              Search
              {isActive && <motion.span layoutId="tabdot" className="tabbar__dot" />}
            </>
          )}
        </NavLink>
        <NavLink
          to={`/profile/${me?.username}`}
          className={({ isActive }) => `tabbar__item ${isActive ? 'is-active' : ''}`}
        >
          {({ isActive }) => (
            <>
              Profile
              {isActive && <motion.span layoutId="tabdot" className="tabbar__dot" />}
            </>
          )}
        </NavLink>
      </nav>
    </>
  );
}
