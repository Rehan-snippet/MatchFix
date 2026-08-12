import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/');
  }

  return (
    <header className="navbar">
      <Link to="/" className="brand">
        MatchFix<span className="brand-accent">!</span>
      </Link>

      <nav className="nav-links">
        <Link to="/turfs">Turfs</Link>
        <Link to="/marketplace">Marketplace</Link>

        {user?.roles?.includes('customer') && (
          <>
            <Link to="/my-bookings">My Bookings</Link>
            <Link to="/my-orders">My Orders</Link>
          </>
        )}
        {user?.roles?.includes('organizer') && <Link to="/organizer">Organizer</Link>}
        {user?.roles?.includes('seller') && <Link to="/seller">Seller</Link>}

        {user ? (
          <>
            <Link to="/profile">{user.name}</Link>
            <button className="link-button" onClick={handleLogout}>
              Log out
            </button>
          </>
        ) : (
          <>
            <Link to="/login">Log in</Link>
            <Link to="/register" className="cta">
              Sign up
            </Link>
          </>
        )}
      </nav>
    </header>
  );
}
