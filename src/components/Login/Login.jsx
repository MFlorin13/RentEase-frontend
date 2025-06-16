import { useState, useEffect } from 'react'; 
import { useNavigate, Link } from 'react-router-dom';
import styles from './Login.module.css';
import api from '../../api/axiosConfig';
import { useAuth } from '../Auth/Auth';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const navigate = useNavigate();
  const { fetchUser, isLoggedIn, loading: authLoading } = useAuth();

  useEffect(() => {
    // Wait for auth loading to complete, then check if user is logged in
    if (!authLoading && isLoggedIn) {
      navigate('/', { replace: true }); // Use replace to prevent going back
    }
  }, [isLoggedIn, authLoading, navigate]);

  const login = async (e) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }

    setIsLoading(true);
    try {
      
      const res = await api.post(
        '/users/login',
        { email, password },
        { withCredentials: true }
      );


      if (res.data.status === 'Success login' || res.data.status === 'success') {
        
        // Update auth context
        await fetchUser();
        
        
        // Navigate to home page
        navigate('/', { replace: true }); // Use replace to prevent going back
      } else {
        setError('Login failed. Please try again.');
      }
    } catch (err) {
      console.error('Login error:', err);
      
      if (err.response?.status === 404 || err.response?.status === 401) {
        setError('Invalid email or password');
      } else if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else {
        setError('Login failed. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className={styles.authContainer}>
        <div className={styles.authCard}>
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            Loading...
          </div>
        </div>
      </div>
    );
  }

  if (isLoggedIn) {
    return null; // Component will redirect via useEffect
  }

  return (
    <div className={styles.authContainer}>
      <div className={styles.authCard}>
        <h2 className={styles.title}>Login</h2>
        {error && <div className={styles.error}>{error}</div>}
        <form className={styles.form} onSubmit={login}>
          <div className={styles.inputGroup}>
            <input
              type="email"
              className={styles.input}
              placeholder=" "
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={isLoading} 
            />
            <label className={styles.label}>Email</label>
          </div>
          <div className={styles.inputGroup}>
            <input
              type="password"
              className={styles.input}
              placeholder=" "
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={isLoading}
            />
            <label className={styles.label}>Password</label>
          </div>
          <button
            type="submit"
            className={styles.button}
            disabled={isLoading}
          >
            {isLoading ? 'Logging in...' : 'Login'}
          </button>
          <div className={styles.loginLink}>
            Don't have an account? <Link to="/register">Sign up</Link>
            <br />
            <Link to="/forgot-password">Forgot Password?</Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;