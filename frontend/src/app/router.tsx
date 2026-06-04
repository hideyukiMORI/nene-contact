import { createBrowserRouter, Navigate, RouterProvider } from 'react-router-dom';
import type { ReactNode } from 'react';
import { useAuth } from '@/app/auth-context';
import { LoginPage } from '@/pages/login';
import { HomePage } from '@/pages/home';

function HomeRoute(): ReactNode {
  const { session, signOut } = useAuth();
  if (session === null) {
    return <Navigate to="/login" replace />;
  }
  return <HomePage session={session} onSignOut={signOut} />;
}

function LoginRoute(): ReactNode {
  const { session, signIn } = useAuth();
  if (session !== null) {
    return <Navigate to="/" replace />;
  }
  return <LoginPage onAuthenticated={signIn} />;
}

const router = createBrowserRouter(
  [
    { path: '/', element: <HomeRoute /> },
    { path: '/login', element: <LoginRoute /> },
  ],
  { basename: '/admin' },
);

export function AppRouter(): ReactNode {
  return <RouterProvider router={router} />;
}
