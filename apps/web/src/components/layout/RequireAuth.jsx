import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useSession } from "../../hooks/useSession.js";
import { homeForRole } from "../../lib/access.js";
import { Spinner } from "../ui.jsx";

export function RequireAuth({ roles }) {
  const session = useSession();
  const location = useLocation();
  if (session.isLoading) return <Spinner />;
  if (!session.data) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  if (roles && !roles.includes(session.data.role)) return <Navigate to={homeForRole(session.data.role)} replace />;
  return <Outlet />;
}
