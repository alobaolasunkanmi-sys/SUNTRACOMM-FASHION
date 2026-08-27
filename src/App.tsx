import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider, useAuth } from './hooks/useAuth';
import Login from './pages/Login';
import SuperAdminDashboard from './pages/superadmin/Dashboard';
import SuperAdminBusinesses from './pages/superadmin/Businesses';
import SuperAdminSettings from './pages/superadmin/Settings';
import BusinessDashboard from './pages/business/Dashboard';
import Layout from './components/Layout';
import Customers from './pages/business/Customers';
import Orders from './pages/business/Orders';
import Payments from './pages/business/Payments';
import Settings from './pages/business/Settings';
import SupabaseConnect from './pages/SupabaseConnect';

function ProtectedRoute({ allowedRoles }: { allowedRoles?: string[] }) {
  const { user, isLoading } = useAuth();
  
  if (isLoading) return <div className="h-screen w-screen flex items-center justify-center">Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;
  
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }
  
  return (
    <Layout>
      <Outlet />
    </Layout>
  );
}

function AppRoutes() {
  const { user, isLoading } = useAuth();
  
  if (isLoading) return <div className="h-screen w-screen flex items-center justify-center">Loading...</div>;

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login />} />
      
      {/* Super Admin Routes */}
      <Route element={<ProtectedRoute allowedRoles={['superadmin']} />}>
        <Route path="/superadmin" element={<SuperAdminDashboard />} />
        <Route path="/superadmin/businesses" element={<SuperAdminBusinesses />} />
        <Route path="/superadmin/supabase" element={<SupabaseConnect />} />
        <Route path="/superadmin/settings" element={<SuperAdminSettings />} />
      </Route>

      {/* Business Routes */}
      <Route element={<ProtectedRoute allowedRoles={['admin', 'staff']} />}>
        <Route path="/business" element={<BusinessDashboard />} />
        <Route path="/business/customers" element={<Customers />} />
        <Route path="/business/orders" element={<Orders />} />
        <Route path="/business/payments" element={<Payments />} />
        <Route path="/business/supabase" element={<SupabaseConnect />} />
        <Route path="/business/settings" element={<Settings />} />
      </Route>

      <Route path="/" element={
        user?.role === 'superadmin' ? <Navigate to="/superadmin" replace /> :
        user?.role === 'admin' ? <Navigate to="/business" replace /> :
        <Navigate to="/login" replace />
      } />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}

