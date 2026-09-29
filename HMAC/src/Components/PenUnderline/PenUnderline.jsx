import { motion } from "framer-motion";
import "./PenUnderline.css";

// Two quick red-pen strokes drawn under a word.
const PenUnderline = ({ delay = 0.4 }) => (
  <svg className="pen-underline" viewBox="0 0 200 24" preserveAspectRatio="none" aria-hidden="true">
    <motion.path
      d="M4 14 C 45 7, 95 5, 140 9 S 188 16, 196 8"
      initial={{ pathLength: 0 }}
      animate={{ pathLength: 1 }}
      transition={{ duration: 0.55, delay, ease: [0.65, 0, 0.35, 1] }}
    />
    <motion.path
      d="M30 20 C 80 15, 140 15, 182 18"
      initial={{ pathLength: 0 }}
      animate={{ pathLength: 1 }}
      transition={{ duration: 0.4, delay: delay + 0.45, ease: [0.65, 0, 0.35, 1] }}
    />
  </svg>
);

export default PenUnderline;
