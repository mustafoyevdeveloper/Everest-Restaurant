import { Suspense, lazy, useEffect } from 'react';
import { Routes, Route, Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Loader from './components/ui/Loader';
import ErrorBoundary from './components/ui/ErrorBoundary';

// Eagerly load core components
import Navbar from './components/Layout/Navbar';
import Footer from './components/Layout/Footer';
import Index from './pages/Index';
import Login from './pages/Login';
import Register from './pages/Register';
import NotFound from './pages/NotFound';
import Profile from './pages/Profile';
// import AdminDashboard from './pages/AdminDashboard';

// Lazy load other pages with error boundaries
const Menu = lazy(() => import('./pages/Menu'));
const ProductDetail = lazy(() => import('./pages/ProductDetail'));
const About = lazy(() => import('./pages/About'));
const Contact = lazy(() => import('./pages/Contact'));
const Cart = lazy(() => import('./pages/Cart'));
const Checkout = lazy(() => import('./pages/Checkout'));
const Reservations = lazy(() => import('./pages/Reservations'));
const PrivacyPolicy = lazy(() => import('./pages/PrivacyPolicy'));
const TermsOfService = lazy(() => import('./pages/TermsOfService'));
const Liked = lazy(() => import('./pages/Liked'));
const MyBookings = lazy(() => import('./pages/MyBookings'));
const Verify = lazy(() => import('./pages/Verify'));
const SetPassword = lazy(() => import('./pages/SetPassword'));
const PasswordReset = lazy(() => import('./pages/PasswordReset'));

// Lazy load admin pages
// const Overview = lazy(() => import('./pages/Admin/Overview'));
// const ProductManagement = lazy(() => import('./pages/Admin/ProductManagement'));
// const OrderManagement = lazy(() => import('./pages/Admin/OrderManagement'));
// const ReservationManagement = lazy(() => import('./pages/Admin/ReservationManagement'));
// const ContactMessages = lazy(() => import('./pages/Admin/ContactMessages'));
// const PaymentNotifications = lazy(() => import('./pages/Admin/PaymentNotifications'));

// Admin Panel pages
const AdminDashboard = lazy(() => import('./pages/AdminPanel/Dashboard'));
const AdminOrders = lazy(() => import('./pages/AdminPanel/Orders'));
const AdminReservations = lazy(() => import('./pages/AdminPanel/Reservations'));
const AdminPayments = lazy(() => import('./pages/AdminPanel/Payments'));
const AdminMessages = lazy(() => import('./pages/AdminPanel/Messages'));
const AdminProducts = lazy(() => import('./pages/AdminPanel/Products'));
const AdminUsers = lazy(() => import('./pages/AdminPanel/Users'));
const AdminBanners = lazy(() => import('./pages/AdminPanel/Banners'));
const AdminLayout = lazy(() => import('./pages/AdminPanel/AdminLayout'));

// Loading component with better error handling
const LoadingFallback = () => (
  <div className="h-screen flex items-center justify-center">
    <Loader />
  </div>
);

// Error fallback for lazy components
const ErrorFallback = () => (
  <div className="h-screen flex items-center justify-center">
    <div className="text-center">
      <h2 className="text-xl font-semibold text-destructive mb-2">
        Failed to load page
      </h2>
      <p className="text-muted-foreground mb-4">
        Please try refreshing the page
      </p>
      <button
        onClick={() => window.location.reload()}
        className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
      >
        Refresh
      </button>
    </div>
  </div>
);

const ProtectedRoute = () => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return <LoadingFallback />;
  }
  
  if (!user || !user.password || user.password.length === 0) {
    return <Navigate to='/' replace />;
  }
  
  return <Outlet />;
};

const AdminRoute = () => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return <LoadingFallback />;
  }
  
  return user && user.role === 'admin' ? <Outlet /> : <Navigate to="/login" replace />;
};

const AppLayout = () => (
  <>
    <Navbar />
    <main className="min-h-[calc(100vh-theme(spacing.16))] pb-16 md:pb-0">
      <ErrorBoundary fallback={<ErrorFallback />}>
        <Suspense fallback={<LoadingFallback />}>
          <Outlet />
        </Suspense>
      </ErrorBoundary>
    </main>
    <Footer />
  </>
);

// Scroll to top component
const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
};

const AppRouter = () => {
  return (
    <>
      <ScrollToTop />
      <Routes>
        {/* Main application routes with Navbar and Footer */}
        <Route element={<AppLayout />}>
          <Route path="/" element={<Index />} />
          <Route path="/menu" element={
            <ErrorBoundary fallback={<ErrorFallback />}>
              <Suspense fallback={<LoadingFallback />}>
                <Menu />
              </Suspense>
            </ErrorBoundary>
          } />
          <Route path="/menu/:id" element={
            <ErrorBoundary fallback={<ErrorFallback />}>
              <Suspense fallback={<LoadingFallback />}>
                <ProductDetail />
              </Suspense>
            </ErrorBoundary>
          } />
          <Route path="/about" element={
            <ErrorBoundary fallback={<ErrorFallback />}>
              <Suspense fallback={<LoadingFallback />}>
                <About />
              </Suspense>
            </ErrorBoundary>
          } />
          <Route path="/cart" element={
            <ErrorBoundary fallback={<ErrorFallback />}>
              <Suspense fallback={<LoadingFallback />}>
                <Cart />
              </Suspense>
            </ErrorBoundary>
          } />
          <Route path="/liked" element={
            <ErrorBoundary fallback={<ErrorFallback />}>
              <Suspense fallback={<LoadingFallback />}>
                <Liked />
              </Suspense>
            </ErrorBoundary>
          } />
          <Route path="/privacy-policy" element={
            <ErrorBoundary fallback={<ErrorFallback />}>
              <Suspense fallback={<LoadingFallback />}>
                <PrivacyPolicy />
              </Suspense>
            </ErrorBoundary>
          } />
          <Route path="/terms-of-service" element={
            <ErrorBoundary fallback={<ErrorFallback />}>
              <Suspense fallback={<LoadingFallback />}>
                <TermsOfService />
              </Suspense>
            </ErrorBoundary>
          } />
          <Route path="/reservations" element={
            <ErrorBoundary fallback={<ErrorFallback />}>
              <Suspense fallback={<LoadingFallback />}>
                <Reservations />
              </Suspense>
            </ErrorBoundary>
          } />
          <Route path="/contact" element={
            <ErrorBoundary fallback={<ErrorFallback />}>
              <Suspense fallback={<LoadingFallback />}>
                <Contact />
              </Suspense>
            </ErrorBoundary>
          } />
          
          {/* Protected Routes */}
          <Route element={<ProtectedRoute />}>
            <Route path="/checkout" element={
              <ErrorBoundary fallback={<ErrorFallback />}>
                <Suspense fallback={<LoadingFallback />}>
                  <Checkout />
                </Suspense>
              </ErrorBoundary>
            } />
            <Route path="/my-bookings" element={
              <ErrorBoundary fallback={<ErrorFallback />}>
                <Suspense fallback={<LoadingFallback />}>
                  <MyBookings />
                </Suspense>
              </ErrorBoundary>
            } />
          </Route>
          
          {/* Profile route - accessible to all authenticated users */}
          <Route path="/profile" element={<Profile />} />
        </Route>

        {/* Auth routes without Navbar/Footer */}
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Register />} />
        
        {/* Not Found Route */}
        <Route path="*" element={<NotFound />} />

        {/* Admin Panel routes */}
        <Route path="/admin" element={
          <ErrorBoundary fallback={<ErrorFallback />}>
            <Suspense fallback={<LoadingFallback />}>
              <AdminLayout />
            </Suspense>
          </ErrorBoundary>
        }>
          <Route index element={
            <ErrorBoundary fallback={<ErrorFallback />}>
              <Suspense fallback={<LoadingFallback />}>
                <AdminDashboard />
              </Suspense>
            </ErrorBoundary>
          } />
          <Route path="orders" element={
            <ErrorBoundary fallback={<ErrorFallback />}>
              <Suspense fallback={<LoadingFallback />}>
                <AdminOrders />
              </Suspense>
            </ErrorBoundary>
          } />
          <Route path="products" element={
            <ErrorBoundary fallback={<ErrorFallback />}>
              <Suspense fallback={<LoadingFallback />}>
                <AdminProducts />
              </Suspense>
            </ErrorBoundary>
          } />
          <Route path="reservations" element={
            <ErrorBoundary fallback={<ErrorFallback />}>
              <Suspense fallback={<LoadingFallback />}>
                <AdminReservations />
              </Suspense>
            </ErrorBoundary>
          } />
          <Route path="payments" element={
            <ErrorBoundary fallback={<ErrorFallback />}>
              <Suspense fallback={<LoadingFallback />}>
                <AdminPayments />
              </Suspense>
            </ErrorBoundary>
          } />
          <Route path="messages" element={
            <ErrorBoundary fallback={<ErrorFallback />}>
              <Suspense fallback={<LoadingFallback />}>
                <AdminMessages />
              </Suspense>
            </ErrorBoundary>
          } />
          <Route path="users" element={
            <ErrorBoundary fallback={<ErrorFallback />}>
              <Suspense fallback={<LoadingFallback />}>
                <AdminUsers />
              </Suspense>
            </ErrorBoundary>
          } />
          <Route path="banners" element={
            <ErrorBoundary fallback={<ErrorFallback />}>
              <Suspense fallback={<LoadingFallback />}>
                <AdminBanners />
              </Suspense>
            </ErrorBoundary>
          } />
        </Route>

        <Route path="/verify" element={<Verify />} />
        <Route path="/set-password" element={<SetPassword />} />
        <Route path="/reset-password" element={<PasswordReset />} />
      </Routes>
    </>
  );
};

export default AppRouter;
