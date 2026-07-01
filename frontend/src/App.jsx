import { Routes, Route } from 'react-router-dom';
import PublicLayout from './components/layout/PublicLayout.jsx';
import PrivateRoute from './components/common/PrivateRoute.jsx';
import HostRoute from './components/common/HostRoute.jsx';

import HomePage from './pages/HomePage.jsx';
import LocationPage from './pages/LocationPage.jsx';
import LocationDetailsPage from './pages/LocationDetailsPage.jsx';
import LoginPage from './pages/LoginPage.jsx';
import ReservationsPage from './pages/ReservationsPage.jsx';
import NotFoundPage from './pages/NotFoundPage.jsx';

import DashboardLayout from './pages/admin/DashboardLayout.jsx';
import ListingsPage from './pages/admin/ListingsPage.jsx';
import CreateListingPage from './pages/admin/CreateListingPage.jsx';
import EditListingPage from './pages/admin/EditListingPage.jsx';
import HostReservationsPage from './pages/admin/HostReservationsPage.jsx';

function App() {
  return (
    <Routes>
      <Route element={<PublicLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/locations/:location" element={<LocationPage />} />
        <Route path="/listings/:id" element={<LocationDetailsPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/reservations"
          element={
            <PrivateRoute>
              <ReservationsPage />
            </PrivateRoute>
          }
        />
        <Route path="*" element={<NotFoundPage />} />
      </Route>

      <Route
        path="/dashboard"
        element={
          <HostRoute>
            <DashboardLayout />
          </HostRoute>
        }
      >
        <Route index element={<ListingsPage />} />
        <Route path="listings/new" element={<CreateListingPage />} />
        <Route path="listings/:id/edit" element={<EditListingPage />} />
        <Route path="reservations" element={<HostReservationsPage />} />
      </Route>
    </Routes>
  );
}

export default App;
