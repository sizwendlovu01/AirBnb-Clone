import { Outlet } from 'react-router-dom';
import Header from './Header.jsx';
import Footer from './Footer.jsx';

// Everything except the host dashboard shares the public site chrome
// (search header + footer). The dashboard has its own minimal admin header.
export default function PublicLayout() {
  return (
    <>
      <Header />
      <main className="page">
        <Outlet />
      </main>
      <Footer />
    </>
  );
}
