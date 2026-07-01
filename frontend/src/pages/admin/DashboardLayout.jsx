import { NavLink, Outlet } from 'react-router-dom';
import AdminHeader from '../../components/admin/AdminHeader.jsx';
import './Dashboard.css';

export default function DashboardLayout() {
  return (
    <div className="admin-dashboard">
      <AdminHeader />
      <nav className="admin-dashboard__pillnav">
        <span className="admin-dashboard__pillnav-divider" />
        <NavLink to="/dashboard/reservations" className="admin-pill">
          View Reservations
        </NavLink>
        <NavLink to="/dashboard" end className="admin-pill">
          View Listings
        </NavLink>
        <NavLink to="/dashboard/listings/new" className="admin-pill">
          Create Listing
        </NavLink>
      </nav>
      <div className="admin-dashboard__content container">
        <Outlet />
      </div>
    </div>
  );
}
