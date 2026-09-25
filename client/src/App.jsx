import { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';

// Route-level code splitting with React.lazy
const Home = lazy(() => import('./pages/Home'));
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const Turfs = lazy(() => import('./pages/Turfs'));
const TurfDetail = lazy(() => import('./pages/TurfDetail'));
const MyBookings = lazy(() => import('./pages/MyBookings'));
const Marketplace = lazy(() => import('./pages/Marketplace'));
const ProductDetail = lazy(() => import('./pages/ProductDetail'));
const MyOrders = lazy(() => import('./pages/MyOrders'));
const OrganizerDashboard = lazy(() => import('./pages/OrganizerDashboard'));
const SellerDashboard = lazy(() => import('./pages/SellerDashboard'));
const Profile = lazy(() => import('./pages/Profile'));
const NotFound = lazy(() => import('./pages/NotFound'));

function PageLoader() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
      <div className="w-10 h-10 border-3 border-neutral-200 border-t-[#16a34a] rounded-full animate-spin" />
      <span className="text-xs font-semibold text-neutral-400 tracking-wider uppercase">Loading MatchFix…</span>
    </div>
  );
}

export default function App() {
  return (
    <>
      <Navbar />
      <main className="app-main">
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            <Route path="/turfs" element={<Turfs />} />
            <Route path="/turfs/:id" element={<TurfDetail />} />

            <Route path="/marketplace" element={<Marketplace />} />
            <Route path="/marketplace/:id" element={<ProductDetail />} />

            <Route
              path="/my-bookings"
              element={
                <ProtectedRoute role="customer">
                  <MyBookings />
                </ProtectedRoute>
              }
            />
            <Route
              path="/my-orders"
              element={
                <ProtectedRoute role="customer">
                  <MyOrders />
                </ProtectedRoute>
              }
            />
            <Route
              path="/organizer"
              element={
                <ProtectedRoute role="organizer">
                  <OrganizerDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/seller"
              element={
                <ProtectedRoute role="seller">
                  <SellerDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              }
            />

            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </main>
    </>
  );
}
