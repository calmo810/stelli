import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import ScrollToTop from './components/ScrollToTop';
import Layout from './components/shared/Layout';
import Home from './pages/Home';
import BrowseLensmen from './pages/BrowseLensmen';
import LensmanProfile from './pages/LensmanProfile';
import BookingFlow from './pages/BookingFlow';
import HowItWorks from './pages/HowItWorks';
import ForCreators from './pages/ForCreators';
import CreatorApplication from './pages/CreatorApplication';
import ClientDashboard from './pages/ClientDashboard';
import LensmanDashboard from './pages/LensmanDashboard';
import Messages from './pages/Messages';
import AdminDashboard from './pages/AdminDashboard';
import ContentDay from './pages/ContentDay';
import MemoryAlbum from './pages/MemoryAlbum';
import Terms from './pages/Terms';
import Privacy from './pages/Privacy';
import AgreementDetail from './pages/AgreementDetail';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

  // Show loading spinner while checking app public settings or auth
  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  // Handle authentication errors
  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      // Redirect to login automatically
      navigateToLogin();
      return null;
    }
  }

  // Render the main app
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path="/browse" element={<BrowseLensmen />} />
        <Route path="/lensman/:id" element={<LensmanProfile />} />
        <Route path="/creators/:id" element={<LensmanProfile />} />
        <Route path="/book/:lensmanId" element={<BookingFlow />} />
        <Route path="/how-it-works" element={<HowItWorks />} />
        <Route path="/for-creators" element={<ForCreators />} />
        <Route path="/apply" element={<CreatorApplication />} />
        <Route path="/client-dashboard" element={<ClientDashboard />} />
        <Route path="/lensman-dashboard" element={<LensmanDashboard />} />
        <Route path="/messages/:bookingId" element={<Messages />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/content-day" element={<ContentDay />} />
        <Route path="/album/:bookingId" element={<MemoryAlbum />} />
        <Route path="/terms" element={<Terms />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/agreements/:contractId" element={<AgreementDetail />} />
      </Route>
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};


function App() {

  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <ScrollToTop />
          <AuthenticatedApp />
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App