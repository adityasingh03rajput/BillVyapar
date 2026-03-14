import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router';
import { Toaster } from './app/components/ui/sonner';
import { ThemeProvider } from './app/contexts/ThemeContext';
import { MasterAdminLoginPage } from './app/pages/MasterAdmin/LoginPage';
import { MasterAdminDashboardPage } from './app/pages/MasterAdmin/DashboardPage';
import { MasterAdminTenantsPage } from './app/pages/MasterAdmin/TenantsPage';
import { MasterAdminTenantDetailsPage } from './app/pages/MasterAdmin/TenantDetailsPage';
import { MasterAdminPlansPage } from './app/pages/MasterAdmin/PlansPage';
import { MasterAdminAuditPage } from './app/pages/MasterAdmin/AuditPage';
import { MasterAdminUsersPage } from './app/pages/MasterAdmin/UsersPage';
import { MasterAdminDataPage } from './app/pages/MasterAdmin/DataPage';
import './styles/index.css';

const router = createBrowserRouter([
  { path: '/', Component: MasterAdminLoginPage },
  { path: '/dashboard', Component: MasterAdminDashboardPage },
  { path: '/tenants', Component: MasterAdminTenantsPage },
  { path: '/tenants/:id', Component: MasterAdminTenantDetailsPage },
  { path: '/plans', Component: MasterAdminPlansPage },
  { path: '/audit', Component: MasterAdminAuditPage },
  { path: '/users', Component: MasterAdminUsersPage },
  { path: '/data', Component: MasterAdminDataPage },
], { basename: '/admin' });

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <RouterProvider router={router} />
      <Toaster />
    </ThemeProvider>
  </StrictMode>
);
