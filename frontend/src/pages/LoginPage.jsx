import { useState } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import './Auth.css';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const DEMO_ACCOUNTS = [
  { label: 'Guest account', email: 'john@example.com', password: 'password123' },
  { label: 'Host account', email: 'jane@example.com', password: 'password321' },
];

function redirectPath(user, fromState) {
  return fromState?.from?.pathname || (user.role === 'host' ? '/dashboard' : '/');
}

export default function LoginPage() {
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  const [mode, setMode] = useState(searchParams.get('mode') === 'register' ? 'register' : 'login');

  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [loginErrors, setLoginErrors] = useState({});

  const [registerForm, setRegisterForm] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    wantsToHost: searchParams.get('role') === 'host',
  });
  const [registerErrors, setRegisterErrors] = useState({});

  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  function switchMode(nextMode) {
    setMode(nextMode);
    setFormError('');
    setLoginErrors({});
    setRegisterErrors({});
  }

  function validateLogin() {
    const errors = {};
    if (!loginForm.email.trim()) {
      errors.email = 'Email is required';
    } else if (!EMAIL_REGEX.test(loginForm.email.trim())) {
      errors.email = 'Enter a valid email address';
    }
    if (!loginForm.password) {
      errors.password = 'Password is required';
    } else if (loginForm.password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    }
    return errors;
  }

  function validateRegister() {
    const errors = {};
    if (!registerForm.username.trim()) {
      errors.username = 'Name is required';
    }
    if (!registerForm.email.trim()) {
      errors.email = 'Email is required';
    } else if (!EMAIL_REGEX.test(registerForm.email.trim())) {
      errors.email = 'Enter a valid email address';
    }
    if (!registerForm.password) {
      errors.password = 'Password is required';
    } else if (registerForm.password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    }
    if (registerForm.confirmPassword !== registerForm.password) {
      errors.confirmPassword = 'Passwords do not match';
    }
    return errors;
  }

  async function handleLogin(e) {
    e.preventDefault();
    setFormError('');

    const errors = validateLogin();
    setLoginErrors(errors);
    if (Object.keys(errors).length) return;

    try {
      setSubmitting(true);
      const user = await login(loginForm.email.trim(), loginForm.password);
      navigate(redirectPath(user, location.state), { replace: true });
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleRegister(e) {
    e.preventDefault();
    setFormError('');

    const errors = validateRegister();
    setRegisterErrors(errors);
    if (Object.keys(errors).length) return;

    try {
      setSubmitting(true);
      const user = await register({
        username: registerForm.username.trim(),
        email: registerForm.email.trim(),
        password: registerForm.password,
        role: registerForm.wantsToHost ? 'host' : 'user',
      });
      navigate(redirectPath(user, location.state), { replace: true });
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  function fillDemo(account) {
    setLoginForm({ email: account.email, password: account.password });
    setLoginErrors({});
  }

  return (
    <div className="auth-page container">
      <div className="auth-card">
        <div className="auth-card__tabs">
          <button
            type="button"
            className={`auth-card__tab ${mode === 'login' ? 'is-active' : ''}`}
            onClick={() => switchMode('login')}
          >
            Log in
          </button>
          <button
            type="button"
            className={`auth-card__tab ${mode === 'register' ? 'is-active' : ''}`}
            onClick={() => switchMode('register')}
          >
            Sign up
          </button>
        </div>

        {mode === 'login' ? (
          <>
            <h1>Log in</h1>
            <p className="auth-card__subtitle">Welcome back to Airbnb Clone</p>

            {formError && <div className="alert alert-error">{formError}</div>}

            <form onSubmit={handleLogin} noValidate>
              <div className="form-group">
                <label htmlFor="email" className="form-label">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  className={`form-input ${loginErrors.email ? 'has-error' : ''}`}
                  value={loginForm.email}
                  onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                />
                {loginErrors.email && <p className="form-error">{loginErrors.email}</p>}
              </div>

              <div className="form-group">
                <label htmlFor="password" className="form-label">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  className={`form-input ${loginErrors.password ? 'has-error' : ''}`}
                  value={loginForm.password}
                  onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                />
                {loginErrors.password && <p className="form-error">{loginErrors.password}</p>}
              </div>

              <button type="submit" className="btn btn-primary btn-full" disabled={submitting}>
                {submitting ? 'Logging in…' : 'Log in'}
              </button>
            </form>

            <div className="auth-card__demo">
              <p>Try a demo account:</p>
              {DEMO_ACCOUNTS.map((acc) => (
                <button key={acc.email} type="button" className="btn btn-outline btn-sm" onClick={() => fillDemo(acc)}>
                  {acc.label}
                </button>
              ))}
            </div>

            <p className="auth-card__footer">
              New here?{' '}
              <button type="button" className="auth-card__link-btn" onClick={() => switchMode('register')}>
                Create an account
              </button>
            </p>
          </>
        ) : (
          <>
            <h1>Sign up</h1>
            <p className="auth-card__subtitle">Join Airbnb Clone as a guest or a host</p>

            {formError && <div className="alert alert-error">{formError}</div>}

            <form onSubmit={handleRegister} noValidate>
              <div className="form-group">
                <label htmlFor="username" className="form-label">
                  Full name
                </label>
                <input
                  id="username"
                  type="text"
                  className={`form-input ${registerErrors.username ? 'has-error' : ''}`}
                  value={registerForm.username}
                  onChange={(e) => setRegisterForm({ ...registerForm, username: e.target.value })}
                />
                {registerErrors.username && <p className="form-error">{registerErrors.username}</p>}
              </div>

              <div className="form-group">
                <label htmlFor="register-email" className="form-label">
                  Email
                </label>
                <input
                  id="register-email"
                  type="email"
                  className={`form-input ${registerErrors.email ? 'has-error' : ''}`}
                  value={registerForm.email}
                  onChange={(e) => setRegisterForm({ ...registerForm, email: e.target.value })}
                />
                {registerErrors.email && <p className="form-error">{registerErrors.email}</p>}
              </div>

              <div className="form-group">
                <label htmlFor="register-password" className="form-label">
                  Password
                </label>
                <input
                  id="register-password"
                  type="password"
                  className={`form-input ${registerErrors.password ? 'has-error' : ''}`}
                  value={registerForm.password}
                  onChange={(e) => setRegisterForm({ ...registerForm, password: e.target.value })}
                />
                {registerErrors.password && <p className="form-error">{registerErrors.password}</p>}
              </div>

              <div className="form-group">
                <label htmlFor="confirm-password" className="form-label">
                  Confirm password
                </label>
                <input
                  id="confirm-password"
                  type="password"
                  className={`form-input ${registerErrors.confirmPassword ? 'has-error' : ''}`}
                  value={registerForm.confirmPassword}
                  onChange={(e) => setRegisterForm({ ...registerForm, confirmPassword: e.target.value })}
                />
                {registerErrors.confirmPassword && <p className="form-error">{registerErrors.confirmPassword}</p>}
              </div>

              <label className="checkbox-row auth-card__host-checkbox">
                <input
                  type="checkbox"
                  checked={registerForm.wantsToHost}
                  onChange={(e) => setRegisterForm({ ...registerForm, wantsToHost: e.target.checked })}
                />
                I want to host my place (unlocks the host dashboard)
              </label>

              <button type="submit" className="btn btn-primary btn-full" disabled={submitting}>
                {submitting ? 'Creating account…' : 'Sign up'}
              </button>
            </form>

            <p className="auth-card__footer">
              Already have an account?{' '}
              <button type="button" className="auth-card__link-btn" onClick={() => switchMode('login')}>
                Log in
              </button>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
