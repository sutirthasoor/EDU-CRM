import React from 'react';
import ClassesPage from './pages/ClassesPage';
import SimpleLeadPage from './pages/SimpleLeadPage';
import SimpleTutorPage from './pages/SimpleTutorPage';
import HelpPage from './pages/HelpPage';
import UniversityPage from './pages/UniversitiesPage';
import PendingTutorsPage from './pages/PendingTutorsPage';
import TasksPage from './pages/TasksPage'; // Add import
import {
  RouterProvider,
  createRouter,
  createRoute,
  createRootRoute,
  Outlet,
} from '@tanstack/react-router';
import { useAuth } from './contexts/AuthContext';
import SubjectsPage from './pages/SubjectsPage';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import TutorDatabasePage from './pages/TutorDatabasePage';
import LeadsPage from './pages/LeadsPage';
import TutorMatchingPage from './pages/TutorMatchingPage';
import DemoSchedulingPage from './pages/DemoSchedulingPage';
import PaymentsPage from './pages/PaymentsPage';
import SupportTicketsPage from './pages/SupportTicketsPage';
import ReportsPage from './pages/ReportsPage';
import SettingsPage from './pages/SettingsPage';
import LocationsPage from './pages/LocationsPage';

// ── Auth Guard ────────────────────────────────────────────────────────────────
function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-muted-foreground text-sm font-medium">Loading TutorMatch CRM...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoginPage />;
  }

  return <>{children}</>;
}

// ── Root Route ────────────────────────────────────────────────────────────────
const rootRoute = createRootRoute({
  component: () => <Outlet />,
});

const classesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/classes',
  component: () => (
    <AuthGuard>
      <ClassesPage />
    </AuthGuard>
  ),
});

const universitiesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/universities',
  component: () => (
    <AuthGuard>
      <UniversityPage />
    </AuthGuard>
  ),
});
const tasksRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/tasks',
  component: () => (
    <AuthGuard>
      <TasksPage />
    </AuthGuard>
  ),
});
const pendingTutorsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/pending-tutors',
  component: () => (
    <AuthGuard>
      <PendingTutorsPage />
    </AuthGuard>
  ),
});

// Simple Lead Form Route
const simpleLeadRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/simple-lead',
  component: () => (
    <AuthGuard>
      <SimpleLeadPage />
    </AuthGuard>
  ),
});

const helpRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/help',
  component: () => (
    <AuthGuard>
      <HelpPage />
    </AuthGuard>
  ),
});

// Simple Tutor Form Route
const simpleTutorRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/simple-tutor',
  component: () => (
    <AuthGuard>
      <SimpleTutorPage />
    </AuthGuard>
  ),
});

// ── Login Route ───────────────────────────────────────────────────────────────
const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/login',
  component: LoginPage,
});

// ── Protected Routes ──────────────────────────────────────────────────────────
const dashboardRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: () => (
    <AuthGuard>
      <DashboardPage />
    </AuthGuard>
  ),
});

const subjectsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/subjects',
  component: () => (
    <AuthGuard>
      <SubjectsPage />
    </AuthGuard>
  ),
});

const tutorsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/tutors',
  component: () => (
    <AuthGuard>
      <TutorDatabasePage />
    </AuthGuard>
  ),
});

const leadsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/leads',
  component: () => (
    <AuthGuard>
      <LeadsPage />
    </AuthGuard>
  ),
});

const matchingRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/matching',
  component: () => (
    <AuthGuard>
      <TutorMatchingPage />
    </AuthGuard>
  ),
});

const demosRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/demos',
  component: () => (
    <AuthGuard>
      <DemoSchedulingPage />
    </AuthGuard>
  ),
});

const paymentsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/payments',
  component: () => (
    <AuthGuard>
      <PaymentsPage />
    </AuthGuard>
  ),
});

const ticketsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/tickets',
  component: () => (
    <AuthGuard>
      <SupportTicketsPage />
    </AuthGuard>
  ),
});

const reportsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/reports',
  component: () => (
    <AuthGuard>
      <ReportsPage />
    </AuthGuard>
  ),
});

const settingsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/settings',
  component: () => (
    <AuthGuard>
      <SettingsPage />
    </AuthGuard>
  ),
});

// ── Locations Route ───────────────────────────────────────────────────────────
const locationsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/locations',
  component: () => (
    <AuthGuard>
      <LocationsPage />
    </AuthGuard>
  ),
});

// ── Router ────────────────────────────────────────────────────────────────────
const routeTree = rootRoute.addChildren([
  loginRoute,
  dashboardRoute,
  tutorsRoute,
  leadsRoute,
  subjectsRoute,
  matchingRoute,
  demosRoute,
  paymentsRoute,
  ticketsRoute,
  reportsRoute,
  settingsRoute,
  locationsRoute,
  simpleLeadRoute,
  simpleTutorRoute,
  classesRoute,
  universitiesRoute,
  tasksRoute,
  helpRoute,
  pendingTutorsRoute,
]);

const router = createRouter({ routeTree });

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}

export default function App() {
  return <RouterProvider router={router} />;
}