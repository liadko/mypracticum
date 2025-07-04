import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { studentId, isOtpVerified } = useAuth();

  // if not logged in, or not yet OTP-verified, go back to login
  if (!studentId || !isOtpVerified) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}