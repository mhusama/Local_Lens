import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { ADMIN_PORTAL_BASE } from '../constants/adminPortal';
import { getAdminToken } from '../utils/adminAuth';

export default function RequireAdminOutlet() {
  const location = useLocation();
  const token = getAdminToken();

  if (!token) {
    return <Navigate to={`${ADMIN_PORTAL_BASE}/login`} replace state={{ from: location }} />;
  }

  return <Outlet />;
}
