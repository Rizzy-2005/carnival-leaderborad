import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom'
import { useAuth } from './hooks/useAuth'

// Lazy loading could be used, but standard imports for simplicity
import Leaderboard from './pages/Leaderboard'
import Login from './pages/Login'
import AdminLogin from './pages/AdminLogin'
import Dashboard from './pages/Dashboard'
import Admin from './pages/Admin'
import SuperAdmin from './pages/SuperAdmin'

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { student, admin, loading } = useAuth()
  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>

  if (allowedRoles.includes('STUDENT')) {
    if (!student) return <Navigate to="/login" replace />
    return children
  }

  if (allowedRoles.includes('ADMIN') || allowedRoles.includes('SUPER_ADMIN')) {
    if (!admin) return <Navigate to="/admin-login" replace />
    
    // Make sure the admin's role is explicitly allowed in allowedRoles
    if (!allowedRoles.includes(admin.role)) {
      return <Navigate to="/admin" replace />
    }

    return children
  }
  
  return <Navigate to="/" replace />
}

const App = () => {
  const router = createBrowserRouter([
    { path: '/', element: <Leaderboard /> },
    { path: '/login', element: <Login /> },
    { path: '/admin-login', element: <AdminLogin /> },
    {
      path: '/dashboard',
      element: (
        <ProtectedRoute allowedRoles={['STUDENT']}>
          <Dashboard />
        </ProtectedRoute>
      )
    },
    {
      path: '/admin',
      element: (
        <ProtectedRoute allowedRoles={['ADMIN', 'SUPER_ADMIN']}>
          <Admin />
        </ProtectedRoute>
      )
    },
    {
      path: '/super-admin',
      element: (
        <ProtectedRoute allowedRoles={['SUPER_ADMIN']}>
          <SuperAdmin />
        </ProtectedRoute>
      )
    }
  ])

  return <RouterProvider router={router} />
}

export default App
