import { BrowserRouter as Router, Routes, Route } from 'react-router';
import TempCreateUser from './pages/temp_create_user.jsx';
import ShopDetails from './pages/ShopDetails.jsx';
import Dashboard from './pages/Dashboard.jsx';
import LandingPage from './pages/LandingPage.jsx';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/create-user" element={<TempCreateUser />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/shop/:shopId" element={<ShopDetails />} />
      </Routes>
    </Router>
  );
}

export default App;