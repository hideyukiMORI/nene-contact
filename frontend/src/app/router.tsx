import { createBrowserRouter, Navigate, RouterProvider } from 'react-router-dom';
import type { ReactNode } from 'react';
import { useAuth } from '@/app/auth-context';
import { ProtectedLayout } from '@/app/protected-layout';
import { LoginPage } from '@/pages/login';
import { HomePage } from '@/pages/home';
import {
  ContactFormsPage,
  ContactFormBuilderPage,
  ContactFormDetailPage,
  ChannelsPage,
} from '@/pages/contact-forms';
import { SubmissionsPage } from '@/pages/submissions';
import { UsersPage } from '@/pages/users';
import { ServiceTokensPage } from '@/pages/service-tokens';
import { AuditLogPage } from '@/pages/audit-log';
import { AccountPage } from '@/pages/account';
import { OrganizationSettingsPage } from '@/pages/settings';
import { HelpPage } from '@/pages/help';

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
        { path: 'contact-forms/:id', element: <ContactFormDetailPage /> },
        { path: 'contact-forms/:id/edit', element: <ContactFormBuilderPage /> },
        { path: 'contact-forms/:id/channels', element: <ChannelsPage /> },
        { path: 'submissions', element: <SubmissionsPage /> },
        { path: 'submissions/:id', element: <SubmissionsPage /> },
        { path: 'users', element: <UsersPage /> },
        { path: 'service-tokens', element: <ServiceTokensPage /> },
        { path: 'audit-log', element: <AuditLogPage /> },
        { path: 'settings/organization', element: <OrganizationSettingsPage /> },
        { path: 'account', element: <AccountPage /> },
        { path: 'help', element: <HelpPage /> },
      ],
    },
  ],
  { basename: '/console' },
);

export function AppRouter(): ReactNode {
  return <RouterProvider router={router} />;
}
