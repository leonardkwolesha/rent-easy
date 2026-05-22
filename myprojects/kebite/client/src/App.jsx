import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { ToastProvider } from './components/Toast';
import { LanguageProvider } from './i18n';
import ProtectedRoute from './components/ProtectedRoute';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Restaurants from './pages/Restaurants';
import RestaurantDetail from './pages/RestaurantDetail';
import Checkout from './pages/Checkout';
import Orders from './pages/Orders';
import OrderTracking from './pages/OrderTracking';
import Profile from './pages/Profile';
import NotFound from './pages/NotFound';
import About from './pages/About';
import Contact from './pages/Contact';
import ResetPassword from './pages/ResetPassword';
import Privacy from './pages/Privacy';
import Cookies from './pages/Cookies';
import Security from './pages/Security';
import ChatWidget from './components/ChatWidget';
import BottomNav from './components/BottomNav';
import RestaurantDashboard from './pages/restaurant/RestaurantDashboard';
import RestaurantMenu from './pages/restaurant/RestaurantMenu';
import RestaurantOrders from './pages/restaurant/RestaurantOrders';
import RestaurantProfile from './pages/restaurant/RestaurantProfile';
import RiderDashboard from './pages/rider/RiderDashboard';
import AdminDashboard from './pages/admin/AdminDashboard';

const FULL_PAGE_ROUTES = [
  '/login', '/register', '/onboarding',
  '/forgot-password', '/reset-password',
  '/checkout',
  '/restaurant/', '/rider/dashboard', '/admin/',
];

function AnimatedRoutes() {
  const location = useLocation();
  const isFullPage = FULL_PAGE_ROUTES.some(r => location.pathname.startsWith(r));
  return (
    <div style={{ paddingBottom: isFullPage ? 0 : '64px' }}>
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        {/* Customer routes */}
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/restaurants" element={<Restaurants />} />
        <Route path="/restaurants/:id" element={<RestaurantDetail />} />
        <Route path="/checkout" element={
          <ProtectedRoute allowedRoles={['customer']}>
            <Checkout />
          </ProtectedRoute>
        } />
        <Route path="/orders" element={<Orders />} />
        <Route path="/orders/:id/track" element={<OrderTracking />} />
        <Route path="/profile" element={<Profile />} />

        {/* Info / legal */}
        <Route path="/about" element={<About />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/cookies" element={<Cookies />} />
        <Route path="/security" element={<Security />} />

        {/* Restaurant partner routes */}
        <Route path="/restaurant/dashboard" element={
          <ProtectedRoute allowedRoles={['restaurant']}>
            <RestaurantDashboard />
          </ProtectedRoute>
        } />
        <Route path="/restaurant/menu" element={
          <ProtectedRoute allowedRoles={['restaurant']}>
            <RestaurantMenu />
          </ProtectedRoute>
        } />
        <Route path="/restaurant/orders" element={
          <ProtectedRoute allowedRoles={['restaurant']}>
            <RestaurantOrders />
          </ProtectedRoute>
        } />
        <Route path="/restaurant/profile" element={
          <ProtectedRoute allowedRoles={['restaurant']}>
            <RestaurantProfile />
          </ProtectedRoute>
        } />

        {/* Rider routes */}
        <Route path="/rider/dashboard" element={
          <ProtectedRoute allowedRoles={['rider']}>
            <RiderDashboard />
          </ProtectedRoute>
        } />

        {/* Admin routes */}
        <Route path="/admin/dashboard" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminDashboard />
          </ProtectedRoute>
        } />
        <Route path="/admin/:section" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminDashboard />
          </ProtectedRoute>
        } />

        <Route path="*" element={<NotFound />} />
      </Routes>
    </AnimatePresence>
    </div>
  );
}

export default function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <CartProvider>
            <ToastProvider>
              <div style={{ fontFamily: "'Segoe UI', system-ui, sans-serif", margin: 0, padding: 0, width: '100%' }}>
                <AnimatedRoutes />
                <ChatWidget />
                <BottomNav />
              </div>
            </ToastProvider>
          </CartProvider>
        </BrowserRouter>
      </AuthProvider>
    </LanguageProvider>
  );
}
