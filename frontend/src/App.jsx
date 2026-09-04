import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { LanguageProvider } from './contexts/LanguageContext';

import LandingPage from './pages/public/LandingPage';
import AccessPage from './pages/public/AccessPage';
import LoginPage from './pages/auth/LoginPage';
import SignupPage from './pages/auth/SignupPage';
import StaffRegisterPage from './pages/auth/StaffRegisterPage';

import FarmerDashboardPage from './pages/farmer/FarmerDashboardPage';
import FindCentresPage from './pages/farmer/FindCentresPage';
import BookSlotPage from './pages/farmer/BookSlotPage';
import BookingSuccessPage from './pages/farmer/BookingSuccessPage';
import MyBookingsPage from './pages/farmer/MyBookingsPage';
import FarmerProcurementPage from './pages/farmer/FarmerProcurementPage';

import StaffDashboardPage from './pages/staff/StaffDashboardPage';
import AdminDashboardPage from './pages/admin/AdminDashboardPage';
import ProtectedRoute from './routes/ProtectedRoute';

export function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Public Landing & Access / Role-Selection Routes */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/access" element={<AccessPage />} />
            <Route path="/auth" element={<AccessPage />} />

            {/* Role-Specific Login & Registration Routes */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/auth/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
            <Route path="/auth/register" element={<SignupPage />} />

            <Route path="/login/farmer" element={<LoginPage defaultRole="FARMER" />} />
            <Route path="/farmer/login" element={<LoginPage defaultRole="FARMER" />} />
            <Route path="/farmer/register" element={<SignupPage />} />
            <Route path="/auth/farmer/login" element={<LoginPage defaultRole="FARMER" />} />
            <Route path="/auth/farmer/register" element={<SignupPage />} />

            <Route path="/login/staff" element={<LoginPage defaultRole="CENTRE_STAFF" />} />
            <Route path="/staff/login" element={<LoginPage defaultRole="CENTRE_STAFF" />} />
            <Route path="/staff/register" element={<StaffRegisterPage />} />
            <Route path="/auth/staff/login" element={<LoginPage defaultRole="CENTRE_STAFF" />} />
            <Route path="/auth/staff/register" element={<StaffRegisterPage />} />

            <Route path="/login/admin" element={<LoginPage defaultRole="ADMIN" />} />
            <Route path="/admin/login" element={<LoginPage defaultRole="ADMIN" />} />
            <Route path="/auth/admin/login" element={<LoginPage defaultRole="ADMIN" />} />

            {/* Dashboard Redirect Aliases */}
            <Route path="/farmer/dashboard" element={<Navigate to="/farmer" replace />} />
            <Route path="/staff/dashboard" element={<Navigate to="/staff" replace />} />
            <Route path="/admin/dashboard" element={<Navigate to="/admin" replace />} />

            {/* Farmer Protected Routes */}
            <Route
              path="/farmer"
              element={
                <ProtectedRoute allowedRoles={['FARMER']}>
                  <FarmerDashboardPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/farmer/find-centres"
              element={
                <ProtectedRoute allowedRoles={['FARMER']}>
                  <FindCentresPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/farmer/book-slot"
              element={
                <ProtectedRoute allowedRoles={['FARMER']}>
                  <BookSlotPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/farmer/booking-success"
              element={
                <ProtectedRoute allowedRoles={['FARMER']}>
                  <BookingSuccessPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/farmer/bookings"
              element={
                <ProtectedRoute allowedRoles={['FARMER']}>
                  <MyBookingsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/farmer/procurement/:bookingId"
              element={
                <ProtectedRoute allowedRoles={['FARMER']}>
                  <FarmerProcurementPage />
                </ProtectedRoute>
              }
            />

            {/* Staff Protected Routes */}
            <Route
              path="/staff/*"
              element={
                <ProtectedRoute allowedRoles={['CENTRE_STAFF']}>
                  <StaffDashboardPage />
                </ProtectedRoute>
              }
            />

            {/* Admin Protected Routes */}
            <Route
              path="/admin/*"
              element={
                <ProtectedRoute allowedRoles={['ADMIN']}>
                  <AdminDashboardPage />
                </ProtectedRoute>
              }
            />

            {/* Catch-all Redirect to Landing Page */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </LanguageProvider>
  );
}

export default App;
