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