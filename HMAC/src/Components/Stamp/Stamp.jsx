import { motion } from "framer-motion";
import "./Stamp.css";

// Rubber stamp that slams down onto the page.
const Stamp = ({ children = "Flagged", tone = "red", size = "md", rotate = -8, delay = 0, className = "" }) => (
  <motion.span
    className={`stamp stamp--${tone} stamp--${size} ${className}`}
    initial={{ opacity: 0, scale: 2.4, rotate: rotate - 10 }}
    animate={{ opacity: 1, scale: 1, rotate }}
    transition={{ type: "spring", stiffness: 520, damping: 20, mass: 0.8, delay }}
  >
    <span className="stamp__inner">{children}</span>
  </motion.span>
);

export default Stamp;
