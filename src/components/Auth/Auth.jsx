import React, { createContext, useContext, useEffect, useState } from 'react';
import api from '../../api/axiosConfig';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchUser = async () => {
    try {
      setLoading(true);
      
      // This will automatically send cookies with the request
      const res = await api.get('/users/me');
      
      
      // Handle nested response structure
      let userData = null;
      if (res.data.status === 'success' && res.data.user) {
        userData = res.data.user;
      } else if (res.data.user) {
        userData = res.data.user;
      } else if (res.data._id) {
        userData = res.data; // Direct user object
      }
      
      
      if (userData) {
        setUser(userData);
        setIsAdmin(userData.isAdmin || false);
        setIsLoggedIn(true);
      } else {
        throw new Error('No user data found in response');
      }
      
    } catch (err) {
      
      // Clear state on authentication failure
      setUser(null);
      setIsAdmin(false);
      setIsLoggedIn(false);
      
      // Don't log error if it's just "no token" - user simply isn't logged in
      if (err.response?.status !== 401) {
        console.error('Unexpected auth error:', err);
      }
    } finally {
      setLoading(false);
    }
  };

  // Check authentication status on app load
  useEffect(() => {
    fetchUser();
  }, []);

  const handleLogin = async (credentials) => {
    try {
      
      // Login request - server will set HTTP-only cookie
      const res = await api.post('/users/login', credentials);
      
      if (res.data.status === 'success' || res.data.user) {
        // Fetch user data after successful login
        await fetchUser();
        return { success: true };
      }
      
      return { success: false, message: 'Login failed' };
      
    } catch (err) {
      return { 
        success: false, 
        message: err.response?.data?.message || 'Login failed' 
      };
    }
  };

  const handleLogout = async () => {
    try {
      
      // Logout request - server will clear HTTP-only cookie
      await api.post('/users/logout');
      
      
      // Clear local state
      setUser(null);
      setIsAdmin(false);
      setIsLoggedIn(false);
      
      return { success: true };
      
    } catch (err) {
      console.error('Logout failed:', err.response?.data?.message || err.message);
      
      // Clear state anyway on logout error
      setUser(null);
      setIsAdmin(false);
      setIsLoggedIn(false);
      
      return { 
        success: false, 
        message: err.response?.data?.message || 'Logout failed' 
      };
    }
  };

  const updateUserData = async (newData) => {
    try {
      const res = await api.patch('/users/updateProfile', newData);
      
      // Handle nested response for updates too
      let updatedUser = null;
      if (res.data.status === 'success' && res.data.updatedUser) {
        updatedUser = res.data.updatedUser;
      } else if (res.data.updatedUser) {
        updatedUser = res.data.updatedUser;
      } else if (res.data.user) {
        updatedUser = res.data.user;
      }
      
      if (updatedUser) {
        setUser(updatedUser);
      }
      
      return { success: true };
    } catch (err) {
      return { 
        success: false, 
        message: err.response?.data?.message || 'Update failed' 
      };
    }
  };

  const value = {
    user,
    isAdmin,
    isLoggedIn,
    loading,
    handleLogout,      
    handleLogin,       
    updateUserData,
    fetchUser,
    refetchUser: fetchUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;