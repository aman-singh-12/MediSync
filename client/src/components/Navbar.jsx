import React, { useState, useContext } from "react";
import { Link, useLocation } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import styles from "./Navbar.module.css";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { user, logout } = useContext(AuthContext);
  const location = useLocation();

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  const closeMenu = () => {
    setIsOpen(false);
  };

  const isAdmin = user?.role === "admin";

  return (
    <nav className={styles.navbar}>
      <Link to="/home" className={styles.logo} onClick={closeMenu}>
        <span>⚕️</span> MediSync
      </Link>

      <button className={styles.hamburger} onClick={toggleMenu}>
        {isOpen ? "✕" : "☰"}
      </button>

      <div className={`${styles.navContent} ${isOpen ? styles.open : ""}`}>
        <div className={styles.navLinks}>
          <Link
            to="/home"
            className={`${styles.link} ${location.pathname === "/home" ? styles.active : ""}`}
            onClick={closeMenu}
          >
            Home
          </Link>
          <Link
            to="/doctors"
            className={`${styles.link} ${location.pathname === "/doctors" ? styles.active : ""}`}
            onClick={closeMenu}
          >
            Find Doctors
          </Link>
          
          {/* Role-based rendering: Admin guard */}
          {isAdmin && (
            <Link
              to="/admin/users"
              className={`${styles.link} ${location.pathname === "/admin/users" ? styles.active : ""}`}
              onClick={closeMenu}
            >
              Manage Users
            </Link>
          )}
        </div>

        <div className={styles.actions}>
          <div style={{ fontWeight: 600, color: "var(--text-primary)" }}>
            {user?.name || user?.email || "User"}
          </div>
          <button className={styles.logoutBtn} onClick={() => { logout(); closeMenu(); }}>
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
