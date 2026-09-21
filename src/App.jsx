import { BrowserRouter as Router } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { queryClientInstance } from '@/lib/query-client';
import { AuthProvider } from '@/lib/AuthContext';
import { MarketProvider } from '@/lib/market';
import ScrollToTop from '@/components/ScrollToTop';
import AppRoutes from '@/app/routes';

export default function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <MarketProvider>
          <Router>
            <ScrollToTop />
            <AppRoutes />
          </Router>
        </MarketProvider>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  );
}
