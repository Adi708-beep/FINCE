import React, { createContext, useState, useEffect, useContext } from 'react';
import io from 'socket.io-client';

const AuthContext = createContext();

export const API_URL = localStorage.getItem('fince_api_url') || 'http://localhost:5000';

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('fince_token'));
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [alerts, setAlerts] = useState([]);
  const [socket, setSocket] = useState(null);
  const [mode, setMode] = useState(localStorage.getItem('fince_mode') || 'personal');

  // Toggle between Personal & Business Modes
  const toggleMode = () => {
    const newMode = mode === 'personal' ? 'business' : 'personal';
    setMode(newMode);
    localStorage.setItem('fince_mode', newMode);
  };

  // Configure Axios / Fetch authorization headers
  const getHeaders = () => {
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
  };

  // 1. Fetch current user profile on load
  const fetchUser = async (authToken) => {
    if (!authToken) {
      setLoading(false);
      return;
    }
    try {
      const res = await fetch(`${API_URL}/api/auth/me`, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });
      if (res.ok) {
        const userData = await res.json();
        setUser(userData);
        setMode(userData.role || 'personal');
        localStorage.setItem('fince_mode', userData.role || 'personal');
        setIsAuthenticated(true);
        fetchAlerts(authToken);
      } else {
        // Token invalid/expired
        logout();
      }
    } catch (err) {
      console.error('Error fetching user profile:', err);
    } finally {
      setLoading(false);
    }
  };

  // 2. Fetch notifications
  const fetchAlerts = async (authToken) => {
    try {
      const res = await fetch(`${API_URL}/api/alerts`, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });
      if (res.ok) {
        const alertData = await res.json();
        setAlerts(alertData);
      }
    } catch (err) {
      console.error('Error fetching alerts:', err);
    }
  };

  useEffect(() => {
    fetchUser(token);
  }, [token]);

  // 3. Socket.io setup on authentication
  useEffect(() => {
    if (user && isAuthenticated) {
      const newSocket = io(API_URL);
      setSocket(newSocket);

      newSocket.on('connect', () => {
        console.log('Client socket connected:', newSocket.id);
        newSocket.emit('join', user._id || user.id);
      });

      newSocket.on('new_alert', (alert) => {
        console.log('Real-time budget alert received:', alert);
        setAlerts(prev => [alert, ...prev]);
        
        // Show browser notification or window alert
        if (Notification.permission === 'granted') {
          newNotification(alert.message);
        } else {
          // Fallback to custom message state, which we will render in a toast
        }
      });

      return () => {
        newSocket.disconnect();
      };
    }
  }, [user, isAuthenticated]);

  const newNotification = (text) => {
    new Notification('FINCE Alert', { body: text });
  };

  // Request browser notification permission
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  // 4. Register
  const register = async (username, email, password, role, fullName, phone, userMode) => {
    try {
      const res = await fetch(`${API_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, password, role, fullName, phone, userMode })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Registration failed');
      }
      localStorage.setItem('fince_token', data.token);
      setToken(data.token);
      setUser(data.user);
      setMode(data.user.role || 'personal');
      localStorage.setItem('fince_mode', data.user.role || 'personal');
      setIsAuthenticated(true);
      return data;
    } catch (err) {
      throw err;
    }
  };

  // 5. Login
  const login = async (email, password, role) => {
    try {
      const res = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, role })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Login failed');
      }
      localStorage.setItem('fince_token', data.token);
      setToken(data.token);
      setUser(data.user);
      setMode(data.user.role || 'personal');
      localStorage.setItem('fince_mode', data.user.role || 'personal');
      setIsAuthenticated(true);
      return data;
    } catch (err) {
      throw err;
    }
  };

  // 6. Logout
  const logout = () => {
    localStorage.removeItem('fince_token');
    setToken(null);
    setUser(null);
    setIsAuthenticated(false);
    setAlerts([]);
    if (socket) {
      socket.disconnect();
      setSocket(null);
    }
  };

  // 7. Link Family
  const linkFamily = async (familyCode) => {
    try {
      const res = await fetch(`${API_URL}/api/auth/family/link`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ familyCode })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Linking failed');
      }
      setUser(data.user);
      return data;
    } catch (err) {
      throw err;
    }
  };

  // 8. Leave Family
  const leaveFamily = async () => {
    try {
      const res = await fetch(`${API_URL}/api/auth/family/leave`, {
        method: 'POST',
        headers: getHeaders()
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Action failed');
      }
      setUser(data.user);
      return data;
    } catch (err) {
      throw err;
    }
  };

  // 9. Read all alerts
  const markAlertsAsRead = async () => {
    try {
      const res = await fetch(`${API_URL}/api/alerts/read-all`, {
        method: 'PUT',
        headers: getHeaders()
      });
      if (res.ok) {
        setAlerts(prev => prev.map(a => ({ ...a, read: true })));
      }
    } catch (err) {
      console.error(err);
    }
  };

  // 10. Clear alerts
  const clearAlerts = async () => {
    try {
      const res = await fetch(`${API_URL}/api/alerts`, {
        method: 'DELETE',
        headers: getHeaders()
      });
      if (res.ok) {
        setAlerts([]);
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      token,
      isAuthenticated,
      loading,
      alerts,
      socket,
      mode,
      toggleMode,
      login,
      register,
      logout,
      linkFamily,
      leaveFamily,
      markAlertsAsRead,
      clearAlerts,
      getHeaders
    }}>
      {children}
    </AuthContext.Provider>
  );
};
