import React, { useState } from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const Navbar = () => {
  const { user, isAuthenticated, isAdmin, isStudent, logout } = useAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const toggleMenu = () => setIsOpen((prev) => !prev);
  const closeMenu = () => setIsOpen(false);

  return (
    <header className="navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-brand" onClick={closeMenu}>
          <span>OIPP</span>
        </Link>

        <button
          type="button"
          className="nav-toggle"
          aria-expanded={isOpen}
          aria-label="Toggle navigation menu"
          onClick={toggleMenu}
        >
          <span aria-hidden="true">&#9776;</span>
        </button>

        <nav
          className={`navbar-nav ${isOpen ? 'open' : ''}`}
          aria-label="Main navigation"
        >
          {isAuthenticated ? (
            <>
              {isStudent && (
                <>
                  <NavLink
                    to="/dashboard"
                    className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                    onClick={closeMenu}
                  >
                    Dashboard
                  </NavLink>
                  <NavLink
                    to="/internships"
                    className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                    onClick={closeMenu}
                  >
                    Internships
                  </NavLink>
                  <NavLink
                    to="/applications"
                    className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                    onClick={closeMenu}
                  >
                    My Applications
                  </NavLink>
                  <NavLink
                    to="/tests"
                    className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                    onClick={closeMenu}
                  >
                    Aptitude Tests
                  </NavLink>
                  <NavLink
                    to="/results"
                    className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                    onClick={closeMenu}
                  >
                    Results
                  </NavLink>
                  <NavLink
                    to="/progress"
                    className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                    onClick={closeMenu}
                  >
                    Progress
                  </NavLink>
                  <NavLink
                    to="/analysis"
                    className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                    onClick={closeMenu}
                  >
                    Analysis
                  </NavLink>
                </>
              )}

              {isAdmin && (
                <>
                  <NavLink
                    to="/admin"
                    end
                    className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                    onClick={closeMenu}
                  >
                    Admin Dashboard
                  </NavLink>
                  <NavLink
                    to="/admin/internships"
                    className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                    onClick={closeMenu}
                  >
                    Manage Internships
                  </NavLink>
                  <NavLink
                    to="/admin/tests"
                    className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                    onClick={closeMenu}
                  >
                    Manage Tests
                  </NavLink>
                </>
              )}

              <div className="navbar-user">
                <span className="user-name" title={user?.name}>
                  {user?.name}
                </span>
                <span className="user-badge">{user?.role}</span>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={handleLogout}
                >
                  Logout
                </button>
              </div>
            </>
          ) : (
            <>
              <NavLink
                to="/login"
                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                onClick={closeMenu}
              >
                Login
              </NavLink>
              <NavLink
                to="/register"
                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                onClick={closeMenu}
              >
                Register
              </NavLink>
            </>
          )}
        </nav>
      </div>
    </header>
  );
};

export default Navbar;
