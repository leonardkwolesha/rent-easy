import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import Toast from './components/Toast';
import ProtectedRoute from './components/ProtectedRoute';
import GuestRoute from './components/GuestRoute';
import Home from './pages/Home';
import Properties from './pages/Properties';
import PropertyDetail from './pages/PropertyDetail';
import Login from './components/ui/sign-in-flow-1';
import Register from './pages/Register.tsx';
import LandlordDashboard from './pages/landlord/Dashboard';
import MyProperties from './pages/landlord/MyProperties';
import Applications from './pages/landlord/Applications';
import Tenants from './pages/landlord/Tenants';
import LandlordPayments from './pages/landlord/Payments';
import TenantDashboard from './pages/tenant/Dashboard';
import MyLease from './pages/tenant/MyLease';
import PayRent from './pages/tenant/PayRent';
import Maintenance from './pages/tenant/Maintenance';
import TenantApplications from './pages/tenant/Applications';
import AdminDashboard from './pages/admin/Dashboard';
import GetApp from './pages/GetApp';
import Privacy from './pages/Privacy';
import Terms from './pages/Terms';
import ApiDocs from './pages/ApiDocs';
import Support from './pages/Support';

const LANDLORD_ROLES = ['landlord', 'agent', 'admin'];

function DashboardRedirect() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" />;
  if (LANDLORD_ROLES.includes(user.role)) return <Navigate to="/landlord" />;
  if (user.role === 'tenant') return <Navigate to="/tenant" />;
  return <Navigate to="/" />;
}

export default function App() {
  const location = useLocation();
  return (
    <>
      <Toast />
      {!['/', '/get-app', '/privacy', '/terms', '/api-docs', '/support'].includes(location.pathname) &&
       !location.pathname.startsWith('/login') && !location.pathname.startsWith('/register') && <Navbar />}
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/properties" element={<Properties />} />
        <Route path="/properties/:id" element={<PropertyDetail />} />
        <Route path="/login" element={<GuestRoute><Login /></GuestRoute>} />
        <Route path="/register" element={<GuestRoute><Register /></GuestRoute>} />
        <Route path="/dashboard" element={<DashboardRedirect />} />

        <Route path="/landlord" element={<ProtectedRoute roles={LANDLORD_ROLES}><LandlordDashboard /></ProtectedRoute>} />
        <Route path="/landlord/properties" element={<ProtectedRoute roles={LANDLORD_ROLES}><MyProperties /></ProtectedRoute>} />
        <Route path="/landlord/applications" element={<ProtectedRoute roles={LANDLORD_ROLES}><Applications /></ProtectedRoute>} />
        <Route path="/landlord/tenants" element={<ProtectedRoute roles={LANDLORD_ROLES}><Tenants /></ProtectedRoute>} />
        <Route path="/landlord/payments" element={<ProtectedRoute roles={LANDLORD_ROLES}><LandlordPayments /></ProtectedRoute>} />

        <Route path="/tenant" element={<ProtectedRoute roles={['tenant']}><TenantDashboard /></ProtectedRoute>} />
        <Route path="/tenant/applications" element={<ProtectedRoute roles={['tenant']}><TenantApplications /></ProtectedRoute>} />
        <Route path="/tenant/lease" element={<ProtectedRoute roles={['tenant']}><MyLease /></ProtectedRoute>} />
        <Route path="/tenant/payments" element={<ProtectedRoute roles={['tenant']}><PayRent /></ProtectedRoute>} />
        <Route path="/tenant/maintenance" element={<ProtectedRoute roles={['tenant']}><Maintenance /></ProtectedRoute>} />

        <Route path="/admin" element={<ProtectedRoute roles={['admin']}><AdminDashboard /></ProtectedRoute>} />

        <Route path="/get-app" element={<GetApp />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/terms" element={<Terms />} />
        <Route path="/api-docs" element={<ApiDocs />} />
        <Route path="/support" element={<Support />} />

        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </>
  );
}
