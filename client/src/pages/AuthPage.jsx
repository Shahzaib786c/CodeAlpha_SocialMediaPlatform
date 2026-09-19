import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AnimatePresence, motion } from 'framer-motion';
import { login, register, clearError, clearRegistered } from '../features/auth/authSlice';

export default function AuthPage() {
  const dispatch = useDispatch();
  const { status, error, registeredEmail } = useSelector((s) => s.auth);
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({
    fullName: '',
    username: '',
    email: '',
    password: '',
  });

  const [notice, setNotice] = useState('');

  /**
   * Sign up does not log you in. When it succeeds we move to the log in
   * tab, carry the email across and say so, so it is obvious what to do next.
   */
  useEffect(() => {
    if (!registeredEmail) return;
    setMode('login');
    setForm((f) => ({ ...f, email: registeredEmail, password: '' }));
    setNotice('Account created. Log in to continue.');
    dispatch(clearRegistered());
  }, [registeredEmail, dispatch]);

  const busy = status === 'loading';
  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  const switchMode = (next) => {
    dispatch(clearError());
    setNotice('');
    setMode(next);
  };

  const submit = () => {
    if (busy) return;
    setNotice('');
    if (mode === 'login') {
      dispatch(login({ email: form.email.trim(), password: form.password }));
    } else {
      dispatch(
        register({
          fullName: form.fullName.trim(),
          username: form.username.trim(),
          email: form.email.trim(),
          password: form.password,
        })
      );
    }
  };

  const onKey = (e) => e.key === 'Enter' && submit();

  return (
    <div className="auth">
      <div className="auth__art">
        <motion.h1
          className="wordmark wordmark--lg"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.2, 0.8, 0.3, 1] }}
        >
          Echo
        </motion.h1>
        <motion.p
          className="auth__tagline"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.12, ease: [0.2, 0.8, 0.3, 1] }}
        >
          Write something. Watch it travel through the people who follow you.
        </motion.p>
      </div>

      <div className="auth__panel">
        <div className="tabs">
          {['login', 'register'].map((m) => (
            <button
              key={m}
              className={`tab ${mode === m ? 'is-active' : ''}`}
              onClick={() => switchMode(m)}
            >
              {mode === m && <motion.span layoutId="tabpill" className="tab__pill" />}
              <span className="tab__label">{m === 'login' ? 'Log in' : 'Create account'}</span>
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={mode}
            className="authform"
            initial={{ opacity: 0, x: mode === 'login' ? -16 : 16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: mode === 'login' ? 16 : -16 }}
            transition={{ duration: 0.2 }}
          >
            {mode === 'register' && (
              <>
                <label className="field">
                  <span>Full name</span>
                  <input value={form.fullName} onChange={set('fullName')} placeholder="Ali Khan" onKeyDown={onKey} />
                </label>
                <label className="field">
                  <span>Username</span>
                  <input value={form.username} onChange={set('username')} placeholder="ali_khan" onKeyDown={onKey} />
                  <small>Letters, numbers and underscores. 3–20 characters.</small>
                </label>
              </>
            )}

            <label className="field">
              <span>Email</span>
              <input
                type="email"
                value={form.email}
                onChange={set('email')}
                placeholder="you@example.com"
                onKeyDown={onKey}
              />
            </label>

            <label className="field">
              <span>Password</span>
              <input
                type="password"
                value={form.password}
                onChange={set('password')}
                placeholder={mode === 'login' ? 'Your password' : 'At least 6 characters'}
                onKeyDown={onKey}
              />
            </label>

            <AnimatePresence>
              {notice && !error && (
                <motion.p
                  className="formnotice"
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                >
                  {notice}
                </motion.p>
              )}
              {error && (
                <motion.p
                  className="formerror"
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                >
                  {error}
                </motion.p>
              )}
            </AnimatePresence>

            <button className="btn btn--primary btn--block" onClick={submit} disabled={busy}>
              {busy ? 'Please wait…' : mode === 'login' ? 'Log in' : 'Create account'}
            </button>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
