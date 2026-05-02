import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  HiOutlineViewGrid,
  HiOutlineFolder,
  HiOutlineClipboardList,
  HiOutlineLogout,
  HiOutlineMenu,
  HiOutlineX,
  HiOutlineUser
} from 'react-icons/hi';

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { path: '/dashboard', label: 'Dashboard', icon: <HiOutlineViewGrid /> },
    { path: '/projects', label: 'Projects', icon: <HiOutlineFolder /> },
    { path: '/tasks', label: 'Tasks', icon: <HiOutlineClipboardList /> },
  ];

  const isActive = (path) => location.pathname.startsWith(path);

  return (
    <div className="app-layout">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <h2 className="sidebar-logo">TaskFlow</h2>
          <button className="sidebar-close" onClick={() => setSidebarOpen(false)}>
            <HiOutlineX />
          </button>
        </div>

        <nav className="sidebar-nav">
          {navItems.map(item => (
            <Link
              key={item.path}
              to={item.path}
              className={`nav-link ${isActive(item.path) ? 'active' : ''}`}
              onClick={() => setSidebarOpen(false)}
            >
              <span className="nav-icon">{item.icon}</span>
              <span className="nav-label">{item.label}</span>
            </Link>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="user-info">
            <div className="user-avatar">
              <HiOutlineUser />
            </div>
            <div className="user-details">
              <span className="user-name">{user?.name}</span>
              <span className="user-role">{user?.role}</span>
            </div>
          </div>
          <button className="logout-btn" onClick={handleLogout}>
            <HiOutlineLogout />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main content area */}
      <div className="main-wrapper">
        <header className="top-bar">
          <button className="menu-toggle" onClick={() => setSidebarOpen(true)}>
            <HiOutlineMenu />
          </button>
          <div className="top-bar-right">
            <span className="greeting">Hi, {user?.name}</span>
            <span className={`role-badge ${user?.role}`}>{user?.role}</span>
          </div>
        </header>

        <main className="main-content">
          {children}
        </main>
      </div>
    </div>
  );
}
