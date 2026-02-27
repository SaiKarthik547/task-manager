import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Dashboard() {
    const { hasRole } = useAuth();

    // Redirect based on role
    if (hasRole(1)) { // Admin
        return <Navigate to="/admin" replace />;
    } else if (hasRole(2)) { // Manager
        return <Navigate to="/manager" replace />;
    } else if (hasRole(3)) { // Employee
        return <Navigate to="/employee" replace />;
    }

    return <Navigate to="/login" replace />;
}
