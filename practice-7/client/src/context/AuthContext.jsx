import React, { createContext, useState, useContext, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [accessToken, setAccessToken] = useState(localStorage.getItem('accessToken'));
  const [refreshToken, setRefreshToken] = useState(localStorage.getItem('refreshToken'));

  useEffect(() => {
    if (accessToken) {
      api.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
      fetchUser();
    } else {
      setLoading(false);
    }
  }, [accessToken]);

  const fetchUser = async () => {
    try {
      const response = await api.get('/auth/me');
      setUser(response.data);
    } catch (error) {
      console.error('Ошибка получения пользователя:', error);
      logout();
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    const response = await api.post('/auth/login', { email, password });
    const { accessToken, refreshToken, user } = response.data;
    
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
    
    setAccessToken(accessToken);
    setRefreshToken(refreshToken);
    setUser(user);
    
    api.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
    
    return user;
  };

  const register = async (email, password, first_name, last_name) => {
    const response = await api.post('/auth/register', { email, password, first_name, last_name });
    return response.data;
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout', { refreshToken });
    } catch (error) {
      console.error('Ошибка выхода:', error);
    }
    
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    
    setAccessToken(null);
    setRefreshToken(null);
    setUser(null);
    
    delete api.defaults.headers.common['Authorization'];
  };

  const refreshTokens = async () => {
    try {
      const response = await api.post('/auth/refresh', { refreshToken });
      const { accessToken, refreshToken: newRefreshToken } = response.data;
      
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', newRefreshToken);
      
      setAccessToken(accessToken);
      setRefreshToken(newRefreshToken);
      
      api.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
      
      return true;
    } catch (error) {
      logout();
      return false;
    }
  };

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    refreshTokens,
    accessToken
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};