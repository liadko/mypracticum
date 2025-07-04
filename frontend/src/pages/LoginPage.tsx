import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import LoginForm from '../components/Login/LoginForm';
import OtpForm from '../components/Login/OtpForm';

export default function LoginPage() {
  const { studentId, isOtpVerified } = useAuth();

  // Step 1: show login form
  if (!studentId) {
    return <LoginForm />;
  }

  // Step 2: show OTP form
  if (!isOtpVerified) {
    return <OtpForm studentId={studentId} />;
  }

  // Already authenticated → go to main app
  return <Navigate to="/" replace />;
}
