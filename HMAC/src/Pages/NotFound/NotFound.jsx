import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

import PageTransition from "../../Components/PageTransition/PageTransition";
import ThemeToggle from "../../Components/ThemeToggle/ThemeToggle";
import Brand from "../../Components/Brand/Brand";
import "./NotFound.css";

const NotFound = () => (
  <PageTransition className="not-found">
    <ThemeToggle className="not-found__theme" />
    <Brand compact />

    <div className="not-found__code">
      <motion.span
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      >
        404
      </motion.span>
      {/* Crossed out in red pen */}
      <svg viewBox="0 0 300 120" preserveAspectRatio="none" aria-hidden="true">
        <motion.path
          d="M10 78 C 90 60, 180 52, 292 34"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.5, delay: 0.6, ease: [0.65, 0, 0.35, 1] }}
        />
        <motion.path
          d="M24 92 C 110 72, 200 64, 282 52"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.4, delay: 0.95, ease: [0.65, 0, 0.35, 1] }}
        />
      </svg>
      <motion.span
        className="not-found__note"
        initial={{ opacity: 0, rotate: -8, y: 6 }}
        animate={{ opacity: 1, rotate: -8, y: 0 }}
        transition={{ delay: 1.3 }}
      >
        wrong page!
      </motion.span>
    </div>

    <h2>This page doesn&apos;t exist</h2>
    <p>The link may be broken, or the page may have moved.</p>
    <Link to="/" className="btn btn-primary btn-lg">
      <ArrowLeft size={18} />
      Back to sign in
    </Link>
  </PageTransition>
);

export default NotFound;
