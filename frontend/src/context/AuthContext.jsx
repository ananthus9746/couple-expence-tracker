import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { auth as authApi, setToken, clearToken, getToken } from '../services/api'

const AuthContext = createContext(null)

// Normalise user so user._id is always set (login returns 'id', getMe returns '_id')
const normalise = (u) => u ? { ...u, _id: u._id || u.id } : u

export const AuthProvider = ({ children }) => {
  const [user,    setUserRaw] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState(null)

  const setUser = (u) => setUserRaw(normalise(u))

  // Restore session from saved token on mount
  useEffect(() => {
    const token = getToken()
    if (!token) { setLoading(false); return }

    authApi.getMe()
      .then(({ user }) => setUser(user))
      .catch(() => clearToken())
      .finally(() => setLoading(false))
  }, [])

  const login = useCallback(async ({ email, password }) => {
    setError(null)
    const data = await authApi.login({ email, password })
    setToken(data.token)
    setUser(data.user)
    return data
  }, [])

  const logout = useCallback(() => {
    clearToken()
    setUser(null)
  }, [])

  const refreshUser = useCallback(async () => {
    const { user } = await authApi.getMe()
    setUser(user)
    return user
  }, [])

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      error,
      setUser,       // exposed so RegisterPage can set user after OTP verify
      login,
      logout,
      refreshUser,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
