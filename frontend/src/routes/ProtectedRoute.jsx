import React from 'react';
import { Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import LoadingState from '../components/common/LoadingState';
import Alert from '../components/common/Alert';
import Button from '../components/common/Button';
import Navbar from '../components/common/Navbar';

export const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { t } = useTranslation();
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-warm-ivory flex flex-col justify-center items-center">
        <LoadingState message={t('auth.verifying_auth')} />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    return (
      <div className="min-h-screen bg-warm-ivory flex flex-col">
        <Navbar />
        <main className="flex-1 max-w-2xl mx-auto p-6 flex flex-col justify-center items-center">
          <Alert type="error" title={t('auth.unauthorized_role_title')}>
            {t('auth.unauthorized_role_desc', { role: user.role })}
          </Alert>
          <div className="mt-6 flex gap-4">
            {user.role === 'FARMER' && (
              <a href="/farmer">
                <Button variant="primary">{t('auth.go_to_farmer_portal')}</Button>
              </a>
            )}
            {user.role === 'CENTRE_STAFF' && (
              <a href="/staff">
                <Button variant="primary">{t('auth.go_to_staff_portal')}</Button>
              </a>
            )}
            {user.role === 'ADMIN' && (
              <a href="/admin">
                <Button variant="primary">{t('auth.go_to_admin_portal')}</Button>
              </a>
            )}
          </div>
        </main>
      </div>
    );
  }

  return children;
};

export default ProtectedRoute;
