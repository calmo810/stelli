import { Navigate, Route, Routes } from 'react-router-dom';
import Layout from '@/components/shared/Layout';
import PageNotFound from '@/lib/PageNotFound';
import LegacyRedirect from '@/components/LegacyRedirect';

import Home from '@/pages/Home';
import BookingFlow from '@/pages/BookingFlow';
import HowItWorks from '@/pages/HowItWorks';
import ForCreators from '@/pages/ForCreators';
import CreatorApplication from '@/pages/CreatorApplication';
import ClientDashboard from '@/pages/ClientDashboard';
import LensmanDashboard from '@/pages/LensmanDashboard';
import Messages from '@/pages/Messages';
import AdminDashboard from '@/pages/AdminDashboard';
import MemoryAlbum from '@/pages/MemoryAlbum';
import Terms from '@/pages/Terms';
import Privacy from '@/pages/Privacy';
import AgreementDetail from '@/pages/AgreementDetail';
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import ForgotPassword from '@/pages/ForgotPassword';
import ResetPassword from '@/pages/ResetPassword';
import Creators from '@/pages/Creators';
import CreatorProfile from '@/pages/CreatorProfile';
import Faq from '@/pages/Faq';
import Onboarding from '@/pages/Onboarding';
import Portal from '@/pages/Portal';
import AdminRoute from '@/components/AdminRoute';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import { useAuth } from '@/lib/AuthContext';

export default function AppRoutes() {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    }

    if (authError.type === 'auth_required') {
      navigateToLogin();
      return null;
    }
  }

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/onboarding" element={<Onboarding />} />

      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path="/browse" element={<Navigate to="/creators" replace />} />
        <Route path="/lensman/:id" element={<LegacyRedirect to="/creators/:id" />} />
        <Route path="/creators" element={<Creators />} />
        <Route path="/creators/:id" element={<CreatorProfile />} />
        <Route path="/faq" element={<Faq />} />
        <Route path="/portal" element={<Portal />} />
        <Route path="/book/:lensmanId" element={<BookingFlow />} />
        <Route path="/how-it-works" element={<HowItWorks />} />
        <Route path="/for-creators" element={<ForCreators />} />
        <Route path="/apply" element={<CreatorApplication />} />
        <Route path="/client-dashboard" element={<ClientDashboard />} />
        <Route path="/lensman-dashboard" element={<LensmanDashboard />} />
        <Route path="/messages/:bookingId" element={<Messages />} />
        <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
        <Route path="/album/:bookingId" element={<MemoryAlbum />} />
        <Route path="/terms" element={<Terms />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/agreements/:contractId" element={<AgreementDetail />} />
      </Route>

      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
}
