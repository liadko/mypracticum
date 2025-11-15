import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

// 1. Make it accept 'children'
export function AdminRoute({ children }: { children: React.ReactNode }) {
    const { user } = useAuth();

    console.log('AdminRoute check:', user);

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    if (!user.roles.includes('admin')) {
        const dest = user.roles.includes('student') ? '/student' : '/mentor';
        return <Navigate to={dest} replace />;
    }

    return <>{children}</>;
}