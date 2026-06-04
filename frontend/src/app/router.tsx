import { createBrowserRouter, Navigate, RouterProvider } from 'react-router-dom';
import type { ReactNode } from 'react';
import { useAuth } from '@/app/auth-context';
import { ProtectedLayout } from '@/app/protected-layout';
import { LoginPage } from '@/pages/login';
import { HomePage } from '@/pages/home';
import { ContactFormsPage, ContactFormBuilderPage } from '@/pages/contact-forms';
import { SubmissionsPage, SubmissionDetailPage } from '@/pages/submissions';

function LoginRoute(): ReactNode {
  const { session, signIn } = useAuth();
  if (session !== null) {
    return <Navigate to="/" replace />;
  }
  return <LoginPage onAuthenticated={signIn} />;
}

const router = createBrowserRouter(
  [
    { path: '/login', element: <LoginRoute /> },
    {
      element: <ProtectedLayout />,
      children: [
        { index: true, element: <HomePage /> },
        { path: 'contact-forms', element: <ContactFormsPage /> },
        { path: 'contact-forms/new', element: <ContactFormBuilderPage /> },
        { path: 'submissions', element: <SubmissionsPage /> },
        { path: 'submissions/:id', element: <SubmissionDetailPage /> },
      ],
    },
  ],
  { basename: '/admin' },
);

export function AppRouter(): ReactNode {
  return <RouterProvider router={router} />;
}
