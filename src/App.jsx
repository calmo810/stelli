import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { lazy, Suspense, useEffect } from 'react';
import { BrowserRouter as Router, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import ScrollToTop from './components/ScrollToTop';
import Layout from './components/shared/Layout';
import Home from './pages/Home';
const BookingFlow = lazy(() => import('./pages/BookingFlow'));
const ForCreators = lazy(() => import('./pages/ForCreators'));
const ProfileWizard = lazy(() => import('./pages/ProfileWizard'));
const ClientDashboard = lazy(() => import('./pages/ClientDashboard'));
const CreatorPortal = lazy(() => import('./pages/creator/CreatorPortal'));
const CreatorOverview = lazy(() => import('./pages/creator/CreatorOverview'));
const CreatorRequests = lazy(() => import('./pages/creator/CreatorRequests'));
const CreatorRequestDetail = lazy(() => import('./pages/creator/CreatorRequestDetail'));
const CreatorBookings = lazy(() => import('./pages/creator/CreatorBookings'));
const CreatorCalendar = lazy(() => import('./pages/creator/CreatorCalendar'));
const CreatorEarnings = lazy(() => import('./pages/creator/CreatorEarnings'));
const CreatorPublicProfile = lazy(() => import('./pages/creator/CreatorPublicProfile'));
const Messages = lazy(() => import('./pages/Messages'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const MemoryAlbum = lazy(() => import('./pages/MemoryAlbum'));
const Terms = lazy(() => import('./pages/Terms'));
const AgreementDetail = lazy(() => import('./pages/AgreementDetail'));
import Login from './pages/Login';
import Register from './pages/Register';
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'));
const ResetPassword = lazy(() => import('./pages/ResetPassword'));
const OAuthConsent = lazy(() => import('./pages/OAuthConsent'));
const Mfa = lazy(() => import('./pages/Mfa'));
const RequestSent = lazy(() => import('./pages/RequestSent'));
const Creators = lazy(() => import('./pages/Creators'));
const CreatorProfile = lazy(() => import('./pages/CreatorProfile'));
const Faq = lazy(() => import('./pages/Faq'));
const Onboarding = lazy(() => import('./pages/Onboarding'));
const Portal = lazy(() => import('./pages/Portal'));
const AccountSettings = lazy(() => import('./pages/AccountSettings'));
import AdminRoute from '@/components/AdminRoute';
import ErrorBoundary from '@/components/shared/ErrorBoundary';
import LegacyRedirect from '@/components/LegacyRedirect';

// Old portal sub-pages now live on the one portal page. Keep any ?query (e.g. Stripe's payout return).
const ToPortal = ({ to }) => {
  const { search } = useLocation();
  return <Navigate to={`${to}${search}`} replace />;
};

// Sending someone to sign in is a side effect, so it happens after the
// render, not in the middle of one.
const RedirectToLogin = ({ go }) => {
  useEffect(() => {
    go();
  }, [go]);
  return null;
};

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

  // Show loading spinner while checking app public settings or auth
  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-ink" role="status" aria-label="Loading Stelli">
        <div className="w-8 h-8 border-4 border-white/15 border-t-white rounded-full animate-spin"></div>
      </div>
    );
  }

  // Handle authentication errors
  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      // Redirect to login automatically
      return <RedirectToLogin go={navigateToLogin} />;
    }
  }

  // Render the main app
  return (
    <Suspense fallback={<div className="min-h-screen bg-background" />}>
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/oauth/consent" element={<OAuthConsent />} />
      {/* Two-factor: finishes a sign-in that needs a second step, and manages the methods. */}
      <Route path="/mfa" element={<Mfa />} />
      <Route path="/onboarding" element={<Onboarding />} />
      <Route path="/apply" element={<ProfileWizard />} />
      <Route path="/edit-profile" element={<ProfileWizard />} />
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path="/browse" element={<Navigate to="/creators" replace />} />
        <Route path="/lensman/:id" element={<LegacyRedirect to="/creators/:id" />} />
        <Route path="/creators" element={<Creators />} />
        <Route path="/creators/:id" element={<CreatorProfile />} />
        <Route path="/faq" element={<Faq />} />
        <Route path="/portal" element={<Portal />} />
        <Route path="/book/:lensmanId" element={<BookingFlow />} />
        <Route path="/request-sent/:bookingId" element={<RequestSent />} />
        <Route path="/for-creators" element={<ForCreators />} />
        {/* Each portal is one page. Old sub-page links fold back into it. */}
        <Route path="/client-dashboard" element={<ClientDashboard />} />
        <Route path="/client-dashboard/messages" element={<Navigate to="/messages" replace />} />
        <Route path="/client-dashboard/*" element={<ToPortal to="/client-dashboard" />} />
        <Route path="/lensman-dashboard/messages" element={<Navigate to="/messages" replace />} />
        <Route path="/lensman-dashboard" element={<CreatorPortal />}>
          <Route index element={<CreatorOverview />} />
          <Route path="requests" element={<CreatorRequests />} />
          <Route path="requests/:bookingId" element={<CreatorRequestDetail />} />
          <Route path="bookings" element={<CreatorBookings />} />
          <Route path="calendar" element={<CreatorCalendar />} />
          <Route path="earnings" element={<CreatorEarnings />} />
          <Route path="profile" element={<CreatorPublicProfile />} />
          <Route path="*" element={<Navigate to="/lensman-dashboard" replace />} />
        </Route>
        <Route path="/account-settings" element={<AccountSettings />} />
        <Route path="/portal/messages" element={<Navigate to="/messages" replace />} />
        <Route path="/messages" element={<Messages />} />
        <Route path="/messages/:bookingId" element={<Messages />} />
        <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
        <Route path="/album/:bookingId" element={<MemoryAlbum />} />
        <Route path="/terms" element={<Terms />} />
        <Route path="/agreements/:contractId" element={<AgreementDetail />} />
        {/* Inside the layout, so a broken link and a page you may not open look identical. */}
        <Route path="*" element={<PageNotFound />} />
      </Route>
    </Routes>
    </Suspense>
  );
};


function App() {

  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <ScrollToTop />
          <ErrorBoundary>
            <AuthenticatedApp />
          </ErrorBoundary>
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App