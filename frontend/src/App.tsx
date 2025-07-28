import React from 'react';
import AppRouter from './router';
import { Toaster } from './components/ui/toaster';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { TooltipProvider } from '@radix-ui/react-tooltip';
import { ShoppingProvider } from "./context/ShoppingContext";
import { AuthProvider } from "./context/AuthContext";
import { AdminNotificationProvider } from "./context/AdminNotificationContext";
import { ThemeProvider } from './context/ThemeContext';
import ErrorBoundary from './components/ui/ErrorBoundary';
import BottomNavBar from './components/Layout/BottomNavBar';
import { BrowserRouter } from 'react-router-dom';
import MobileTopNavbar from './components/Layout/MobileTopNavbar';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      retryDelay: 1000,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
        <TooltipProvider>
          <QueryClientProvider client={queryClient}>
            <AuthProvider>
              <AdminNotificationProvider>
                <ShoppingProvider>
                  <BrowserRouter>
                    <MobileTopNavbar />
                    <AppRouter />
                    <BottomNavBar />
                  </BrowserRouter>
                </ShoppingProvider>
              </AdminNotificationProvider>
            </AuthProvider>
            <Toaster />
          </QueryClientProvider>
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
