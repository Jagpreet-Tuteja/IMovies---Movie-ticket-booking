import { createContext, useContext, useEffect, useState } from 'react';
import api, { TOKEN_KEY } from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Restore the session from a stored token
  useEffect(() => {
    if (!localStorage.getItem(TOKEN_KEY)) return setLoading(false);
    api
      .get('/auth/me')
      .then((res) => setUser(res.data.user))
      .catch(() => localStorage.removeItem(TOKEN_KEY))
      .finally(() => setLoading(false));
  }, []);

  const handleAuth = ({ token, user }) => {
    localStorage.setItem(TOKEN_KEY, token);
    setUser(user);
    return user;
  };

  // Customers and admins log in through different endpoints
  const login = async (email, password, asAdmin = false) =>
    handleAuth((await api.post(asAdmin ? '/admin/login' : '/auth/login', { email, password })).data);

  const register = async (fields) => handleAuth((await api.post('/auth/register', fields)).data);

  const updateProfile = async (fields) => {
    const { data } = await api.put('/auth/me', fields);
    setUser(data.user);
  };

  const logout = () => {
    api.post('/auth/logout').catch(() => {});
    localStorage.removeItem(TOKEN_KEY);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, updateProfile, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
