import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import TempCreateUser from './pages/temp_create_user.jsx';
import ShopDetails from './pages/ShopDetails.jsx';
import Dashboard from './pages/Dashboard.jsx';
import LandingPage from './pages/LandingPage.jsx';
import CategoryPage from './pages/CategoryPage.jsx';
import ComparePage from './pages/ComparePage.jsx';
import CartPage from './pages/CartPage.jsx';
import WishlistPage from './pages/WishlistPage.jsx';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/create-user" element={<TempCreateUser />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/shop/:shopId" element={<ShopDetails />} />
        <Route path="/category/:categoryName" element={<CategoryPage />} />
        <Route path="/compare" element={<ComparePage />} />
        <Route path="/cart" element={<CartPage />} />
        <Route path="/wishlist" element={<WishlistPage />} />
      </Routes>
    </Router>
  );
}




export default App;