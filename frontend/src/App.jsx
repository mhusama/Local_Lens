import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import ShopDetails from './pages/ShopDetails.jsx';
import Dashboard from './pages/Dashboard.jsx';
import LandingPage from './pages/LandingPage.jsx';
import SignIn from './pages/SignIn.jsx';
import SearchedItem from './pages/SearchedItem.jsx';
import CategoryPage from './pages/CategoryPage.jsx';
import ComparePage from './pages/ComparePage.jsx';
import CartPage from './pages/CartPage.jsx';
import WishlistPage from './pages/WishlistPage.jsx';
import MyAccount from './pages/MyAccount.jsx';
import Navbar from './components/Navbar.jsx';
import CreateAccount from './pages/CreateAccount.jsx';
import CreateShop from './pages/CreateShop.jsx';
import ProductDetails from './pages/ProductDetails.jsx';
import ContactUs from './pages/ContactUs.jsx';
import AdminShell from './layouts/AdminShell.jsx';
import RequireAdminOutlet from './layouts/RequireAdminOutlet.jsx';
import AdminLogin from './pages/admin/AdminLogin.jsx';
import AdminSignup from './pages/admin/AdminSignup.jsx';
import AdminHome from './pages/admin/AdminHome.jsx';
import AdminReports from './pages/admin/AdminReports.jsx';
import { ADMIN_PORTAL_BASE, ADMIN_SECRET_SIGNUP_SEGMENT } from './constants/adminPortal';

function AppLayout() {
  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <Outlet />
    </div>
  );
}

function MyAccountRoute() {
  let user = null;
  try {
    user = JSON.parse(localStorage.getItem('user') || 'null');
  } catch {
    user = null;
  }
  const token = localStorage.getItem('token');
  const loggedIn = Boolean(user || token);
  return loggedIn ? <MyAccount /> : <SignIn />;
}

function DashboardRoute() {
  let user = null;
  try {
    user = JSON.parse(localStorage.getItem('user') || 'null');
  } catch {
    user = null;
  }
  return user ? <Dashboard /> : <Navigate to="/signin" replace />;
}

function CreateShopRoute() {
  let user = null;
  try {
    user = JSON.parse(localStorage.getItem('user') || 'null');
  } catch {
    user = null;
  }
  return user ? <CreateShop /> : <Navigate to="/signin" replace />;
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path={ADMIN_PORTAL_BASE} element={<AdminShell />}>
          <Route path="login" element={<AdminLogin />} />
          <Route path={ADMIN_SECRET_SIGNUP_SEGMENT} element={<AdminSignup />} />
          <Route element={<RequireAdminOutlet />}>
            <Route index element={<AdminHome />} />
            <Route path="reports" element={<AdminReports />} />
            <Route path="*" element={<Navigate to={ADMIN_PORTAL_BASE} replace />} />
          </Route>
        </Route>

        <Route element={<AppLayout />}>
          <Route path="/" element={<LandingPage />} />
          <Route path="/create-account" element={<CreateAccount />} />
          <Route path="/sign-in" element={<SignIn />} />
          <Route path="/signin" element={<SignIn />} />
          <Route path="/search" element={<SearchedItem />} />
          <Route path="/my-account" element={<MyAccountRoute />} />
          <Route path="/create-user" element={<CreateAccount />} />
          <Route path="/dashboard" element={<DashboardRoute />} />
          <Route path="/create-shop" element={<CreateShopRoute />} />
          <Route path="/shop/:shopId" element={<ShopDetails />} />
          <Route path="/product/:productId" element={<ProductDetails />} />
          <Route path="/category/:categoryName" element={<CategoryPage />} />
          <Route path="/compare" element={<ComparePage />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/wishlist" element={<WishlistPage />} />
          <Route path="/contact" element={<ContactUs />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </Router>
  );
}




export default App;