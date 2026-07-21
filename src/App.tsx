import { Provider } from 'react-redux'
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";

// components
import { Toaster } from "./components/ui/toaster";
import { Toaster as Sonner } from "./components/ui/sonner";
import { TooltipProvider } from "./components/ui/tooltip";
import { AuthProvider } from "./contexts/AuthContext";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";
import { PublicLayout } from "./components/layout/PublicLayout";
import { DashboardLayout } from "./components/dashboard/DashboardLayout";
import { ScrollToTop } from "./components/ScrollToTop";

// pages
import Index from "./pages/Index";
import About from "./pages/About";
import Programs from "./pages/Programs";
import Events from "./pages/Events";
import Notices from "./pages/Notices";
import Contact from "./pages/Contact";
import Volunteer from "./pages/Volunteer";
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";
import DashboardHome from "./pages/dashboard/DashboardHome";
import StudentsPage from "./pages/dashboard/StudentsPage";
import VolunteersPage from "./pages/dashboard/VolunteersPage";
import SessionsPage from "./pages/dashboard/SessionsPage";
import AttendancePage from "./pages/dashboard/AttendancePage";
import MySessionsPage from "./pages/dashboard/MySessionsPage";
import SessionDetailPage from "./pages/dashboard/SessionDetailPage";
import MyAttendancePage from "./pages/dashboard/MyAttendancePage";
import NoticesPage from "./pages/dashboard/NoticesPage";
import EventsPage from "./pages/dashboard/EventsPage";
import ApplicationsPage from "./pages/dashboard/ApplicationsPage";
import ReportsPage from "./pages/dashboard/ReportsPage";
import SettingsPage from "./pages/dashboard/SettingsPage";
import ProfilePage from "./pages/dashboard/ProfilePage";

import { SiteContentProvider } from "./contexts/SiteContentContext";
// mics
import { store } from "./store/store";
import SiteCustomizationPage from "./pages/dashboard/SiteCustomizationPage";

const queryClient = new QueryClient();

const App = () => {
  return (
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <SiteContentProvider>
            <TooltipProvider>
              <Toaster />
              <Sonner />

              <BrowserRouter>
                <ScrollToTop />
                <Routes>

                  {/* Public Routes */}
                  <Route element={<PublicLayout />}>
                    <Route path="/" element={<Index />} />

                    <Route path="/about" element={<About />} />
                    <Route path="/programs" element={<Programs />} />
                    <Route path="/events" element={<Events />} />
                    <Route path="/notices" element={<Notices />} />
                    <Route path="/contact" element={<Contact />} />
                    <Route path="/volunteer" element={<Volunteer />} />
                  </Route>
                  <Route path="/login" element={<Login />} />

                  {/* Dashboard Routes */}
                  <Route
                    path="/dashboard"
                    element={
                      <ProtectedRoute>
                        <DashboardLayout />
                      </ProtectedRoute>
                    }
                  >
                    <Route index element={<DashboardHome />} />
                    <Route
                      path="students"
                      element={
                        <ProtectedRoute requiredRole="admin">
                          <StudentsPage />
                        </ProtectedRoute>
                      }
                    />

                    <Route
                      path="volunteers"
                      element={
                        <ProtectedRoute requiredRole="admin">
                          <VolunteersPage />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="sessions"
                      element={
                        <ProtectedRoute requiredRole="admin">
                          <SessionsPage />
                        </ProtectedRoute>
                      }
                    />
                    <Route path="attendance" element={<AttendancePage />} />
                    <Route path="my-sessions" element={<MySessionsPage />} />
                    <Route path="my-sessions/:id" element={<SessionDetailPage />} />
                    <Route path="my-attendance" element={<MyAttendancePage />} />
                    <Route
                      path="notices"
                      element={
                        <ProtectedRoute>
                          <NoticesPage />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="events"
                      element={
                        <ProtectedRoute>
                          <EventsPage />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="applications"
                      element={
                        <ProtectedRoute requiredRole="admin">
                          <ApplicationsPage />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="reports"
                      element={
                        <ProtectedRoute requiredRole="admin">
                          <ReportsPage />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="settings"
                      element={
                        <ProtectedRoute requiredRole="admin">
                          <SettingsPage />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="customize"
                      element={
                        <ProtectedRoute requiredRole="admin">
                          <SiteCustomizationPage />
                        </ProtectedRoute>
                      }
                    />
                    <Route path="profile" element={<ProfilePage />} />
                  </Route>

                  <Route path="*" element={<NotFound />} />
                </Routes>
              </BrowserRouter>
            </TooltipProvider>
          </SiteContentProvider>
        </AuthProvider>
      </QueryClientProvider>
    </Provider>
  );
};

export default App;
