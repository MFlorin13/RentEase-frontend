import { useEffect, useState } from "react";
import { FaUserCircle } from "react-icons/fa";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../Auth/Auth";
import ThemeToggle from "../ThemeToggle/ThemeToggle";
import styles from "./NavBar.module.css";
import DeleteAccount from "../DeleteAccount/DeleteAccount";

const NavBar = () => {
  const [isLoading, setIsLoading] = useState(true);
  const { isLoggedIn, isAdmin, handleLogout, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    setIsLoading(false);
  }, []);

  const logoutAndRedirect = () => {
    handleLogout();
    navigate("/login");
  };

  if (isLoading) return null;

  return (
    <nav className={styles.navbar}>
      <div className={styles.navbarContainer}>
        <NavLink 
          to="/" 
          className={styles.logo}
          style={{ textDecoration: 'none', color: 'inherit' }}
        >
          FlatFinder
        </NavLink>
        <div className={styles.navLinks}>
          {isLoggedIn ? (
            <>
              <NavLink
                to="/"
                className={({ isActive }) =>
                  isActive ? styles.activeLink : styles.link
                }
              >
                All Flats
              </NavLink>
              <NavLink
                to="/my-flats"
                className={({ isActive }) =>
                  isActive ? styles.activeLink : styles.link
                }
              >
                My Flats
              </NavLink>
              <NavLink
                to="/favorites"
                className={({ isActive }) =>
                  isActive ? styles.activeLink : styles.link
                }
              >
                Favorites
              </NavLink>
              <NavLink
                to="/add-flat"
                className={({ isActive }) =>
                  isActive ? styles.activeLink : styles.link
                }
              >
                Add Flat
              </NavLink>
              <NavLink
                to="/profile"
                className={({ isActive }) =>
                  isActive ? styles.activeLink : styles.link
                }
              >
                Update Profile
              </NavLink>
              <DeleteAccount />
              {isAdmin && (
                <NavLink
                  to="/admin"
                  className={({ isActive }) =>
                    isActive ? styles.activeLink : styles.link
                  }
                >
                  Admin
                </NavLink>
              )}
              <div className={styles.userInfo}>
                <FaUserCircle className={styles.avatar} />
                <span className={styles.userName}>
                  {user ? `${user.firstName} ${user.lastName}` : 'Loading...'}
                </span>
              </div>
              {/* Add the theme toggle button here */}
              <ThemeToggle />
              <button
                className={`${styles.navbarButton} ${styles.link}`}
                onClick={logoutAndRedirect}
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <NavLink
                to="/login"
                className={({ isActive }) =>
                  isActive ? styles.activeLink : styles.link
                }
              >
                Login
              </NavLink>
              <NavLink
                to="/register"
                className={({ isActive }) =>
                  isActive ? styles.activeLink : styles.link
                }
              >
                Register
              </NavLink>
              {/* Add theme toggle for non-logged users too */}
              <ThemeToggle />
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default NavBar;