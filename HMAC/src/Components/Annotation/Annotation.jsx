import { motion } from "framer-motion";
import "./Annotation.css";

const ARROWS = {
  down: { viewBox: "0 0 40 44", d: "M10 3 C 4 16, 8 30, 28 38 M19 39 L28 38 L25 29" },
  left: { viewBox: "0 0 50 30", d: "M47 18 C 34 6, 17 5, 5 15 M5 15 L6 5 M5 15 L15 16" },
  right: { viewBox: "0 0 50 30", d: "M3 18 C 16 6, 33 5, 45 15 M45 15 L44 5 M45 15 L35 16" },
};

const Arrow = ({ direction, delay }) => {
  const arrow = ARROWS[direction];
  return (
    <svg className={`annotation__arrow annotation__arrow--${direction}`} viewBox={arrow.viewBox} aria-hidden="true">
      <motion.path
        d={arrow.d}
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.6, delay: delay + 0.2, ease: "easeInOut" }}
      />
    </svg>
  );
};

// A handwritten note in the margin, optionally with a hand-drawn arrow.
const Annotation = ({ children, arrow, tone = "red", rotate = -4, delay = 0.6, className = "" }) => (
  <motion.span
    className={`annotation annotation--${tone} ${className}`}
    initial={{ opacity: 0, y: 6, rotate }}
    animate={{ opacity: 1, y: 0, rotate }}
    transition={{ duration: 0.5, delay }}
  >
    {(arrow === "left") && <Arrow direction="left" delay={delay} />}
    <span className="annotation__text">{children}</span>
    {(arrow === "down" || arrow === "right") && <Arrow direction={arrow} delay={delay} />}
  </motion.span>
);

export default Annotation;
