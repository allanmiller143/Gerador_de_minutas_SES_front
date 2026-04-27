import { Navigate } from "react-router-dom";
import { ReactNode } from "react";
import { useAuth } from "@/context/AuthContext";
import type { UserRole } from "@/data/mock";

interface Props {
  children: ReactNode;
  roles?: UserRole[];
}

export const ProtectedRoute = ({ children, roles }: Props) => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/" replace />;
  return <>{children}</>;
};
