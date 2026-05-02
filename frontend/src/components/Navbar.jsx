import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout, isAdmin } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path ? 'nav-link active' : 'nav-link';

  if (!user) return null;

  return (
    <nav className="navbar">
      <div className="nav-brand">
        <Link to="/dashboard">
          <span className="brand-icon">⚡</span>
          <span className="brand-text">TaskFlow</span>
        </Link>
      </div>
      <div className="nav-links">
        <Link to="/dashboard" className={isActive('/dashboard')}>
          <span className="nav-icon">📊</span> Dashboard
        </Link>
        <Link to="/projects" className={isActive('/projects')}>
          <span className="nav-icon">📁</span> Projects
        </Link>
        {isAdmin && (
          <Link to="/admin" className={isActive('/admin')}>
            <span className="nav-icon">⚙️</span> Admin
          </Link>
        )}
      </div>
      <div className="nav-user">
        <div className="user-info">
          <span className="user-avatar">{user.name.charAt(0).toUpperCase()}</span>
          <div className="user-details">
            <span className="user-name">{user.name}</span>
            <span className={`user-role role-${user.role.toLowerCase()}`}>{user.role}</span>
          </div>
        </div>
        <button onClick={handleLogout} className="btn-logout">Logout</button>
      </div>
    </nav>
  );
}
