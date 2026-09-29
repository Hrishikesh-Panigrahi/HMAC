import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CircleQuestionMark, CloudUpload, FileSearch, LayoutDashboard, LogIn, LogOut, Menu, X } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { toast } from "sonner";

import Brand from "../Brand/Brand";
import ThemeToggle from "../ThemeToggle/ThemeToggle";
import HowItWorks from "../HowItWorks/HowItWorks";
import "./Navbar.css";

const LINKS = {
  student: [{ to: "/Student", label: "Upload", icon: CloudUpload }],
  professor: [
    { to: "/Professor", label: "Review", icon: FileSearch },
    { to: "/Summary", label: "Summary", icon: LayoutDashboard },
  ],
};

const hasToken = () => {
  try {
    return localStorage.getItem("access_token") !== null;
  } catch {
    return false;
  }
};

const Navbar = ({ variant = "student" }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const isAuth = hasToken();
  const links = LINKS[variant] ?? LINKS.student;
  const path = location.pathname.toLowerCase();

  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const closeHelp = useCallback(() => setHelpOpen(false), []);

  const openHelp = () => {
    setMenuOpen(false);
    setHelpOpen(true);
  };

  const handleLogout = () => {
    // Clear the authentication tokens from local storage
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    toast("Signed out");
    navigate("/");
  };

  // OCR result pages are reached from the Summary, so keep Summary highlighted there.
  const isActive = (to) =>
    path === to.toLowerCase() || (to === "/Summary" && path.startsWith("/ocrresult/"));

  const authButton = isAuth ? (
    <button type="button" className="btn btn-outline" onClick={handleLogout}>
      <LogOut size={16} />
      Log out
    </button>
  ) : (
    <Link to="/" className="btn btn-primary">
      <LogIn size={16} />
      Sign in
    </Link>
  );

  return (
    <>
      <motion.header
        className={`nav ${scrolled ? "nav--scrolled" : ""}`}
        initial={{ y: -24, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="nav__bar">
          <Link to={links[0].to} className="nav__brand" aria-label="HMAC home">
            <Brand compact />
          </Link>

          <nav className="nav__links" aria-label="Main">
            {links.map(({ to, label, icon: Icon }) => {
              const active = isActive(to);
              return (
                <Link key={to} to={to} className={`nav__link ${active ? "is-active" : ""}`} aria-current={active ? "page" : undefined}>
                  {active && (
                    <motion.span
                      layoutId="nav-highlight"
                      className="nav__highlight"
                      transition={{ type: "spring", stiffness: 420, damping: 34 }}
                    />
                  )}
                  <Icon size={16} />
                  <span>{label}</span>
                </Link>
              );
            })}
            <button type="button" className="nav__link" onClick={openHelp}>
              <CircleQuestionMark size={16} />
              <span>How to use</span>
            </button>
          </nav>

          <div className="nav__actions">
            <ThemeToggle />
            <div className="nav__auth">{authButton}</div>
            <button
              type="button"
              className="btn btn-ghost btn-icon nav__menu-toggle"
              onClick={() => setMenuOpen((open) => !open)}
              aria-expanded={menuOpen}
              aria-controls="mobile-menu"
              aria-label={menuOpen ? "Close menu" : "Open menu"}
            >
              <AnimatePresence mode="wait" initial={false}>
                <motion.span
                  key={menuOpen ? "close" : "open"}
                  initial={{ opacity: 0, rotate: -90 }}
                  animate={{ opacity: 1, rotate: 0 }}
                  exit={{ opacity: 0, rotate: 90 }}
                  transition={{ duration: 0.18 }}
                  style={{ display: "grid" }}
                >
                  {menuOpen ? <X size={20} /> : <Menu size={20} />}
                </motion.span>
              </AnimatePresence>
            </button>
          </div>
        </div>

        <AnimatePresence>
          {menuOpen && (
            <motion.div
              id="mobile-menu"
              className="nav__mobile"
              initial={{ opacity: 0, y: -12, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.98 }}
              transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            >
              {links.map(({ to, label, icon: Icon }) => (
                <Link key={to} to={to} className={`nav__mobile-link ${isActive(to) ? "is-active" : ""}`}>
                  <Icon size={18} />
                  {label}
                </Link>
              ))}
              <button type="button" className="nav__mobile-link" onClick={openHelp}>
                <CircleQuestionMark size={18} />
                How to use
              </button>
              <div className="nav__mobile-auth">{authButton}</div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.header>

      <HowItWorks open={helpOpen} onClose={closeHelp} />
    </>
  );
};

export default Navbar;
