import { motion } from "framer-motion";
import Stamp from "../Stamp/Stamp";

// Opening of the sample assignment the OCR pipeline is tested against.
const LINES = [
  "One sunny day, Wishers",
  "decided to go on an",
  "adventure. They all",
  "decided to explore the",
  "mysterious forest.",
];
const HIGHLIGHTED_LINE = 3;

const WRITE_START = 0.9;
const WRITE_STEP = 0.45;
const WRITE_END = WRITE_START + LINES.length * WRITE_STEP;

// Decorative hero: a handwritten page gets written, highlighted, graded and stamped.
const GradedPaper = () => (
  <div className="graded" aria-hidden="true">
    <motion.div
      className="sheet graded__under"
      initial={{ opacity: 0, rotate: 0 }}
      animate={{ opacity: 1, rotate: 4 }}
      transition={{ duration: 0.8, delay: 0.35, ease: [0.22, 1, 0.36, 1] }}
    />
    <motion.div
      className="sheet sheet--ruled graded__sheet"
      initial={{ opacity: 0, y: 48, rotate: -9 }}
      animate={{ opacity: 1, y: 0, rotate: -2.5 }}
      transition={{ duration: 0.9, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="graded__meta">
        <span>Assignment 3</span>
        <span>Roll no. 42</span>
      </div>

      {LINES.map((line, index) => (
        <div className="graded__line" key={line}>
          {index === HIGHLIGHTED_LINE && (
            <motion.span
              className="graded__highlight"
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: 0.45, delay: WRITE_END, ease: [0.3, 0.9, 0.3, 1] }}
            />
          )}
          <motion.span
            className="graded__ink"
            initial={{ clipPath: "inset(0 100% 0 0)" }}
            animate={{ clipPath: "inset(0 0% 0 0)" }}
            transition={{ duration: WRITE_STEP, delay: WRITE_START + index * WRITE_STEP, ease: "linear" }}
          >
            {line}
          </motion.span>
        </div>
      ))}

      <div className="graded__grade">
        <svg viewBox="0 0 110 80">
          <motion.path
            d="M84 16 C 104 28, 102 64, 60 68 C 24 71, 8 56, 11 38 C 14 18, 40 8, 68 10 C 84 11, 94 17, 100 27"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.7, delay: WRITE_END + 0.3, ease: [0.65, 0, 0.35, 1] }}
          />
        </svg>
        <motion.span
          className="graded__score"
          initial={{ opacity: 0, scale: 0.6 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: WRITE_END + 0.5, type: "spring", stiffness: 300, damping: 16 }}
        >
          72%
        </motion.span>
        <motion.span
          className="graded__note"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: WRITE_END + 0.9 }}
        >
          likely AI?
        </motion.span>
      </div>

      <Stamp className="graded__stamp" size="lg" rotate={-12} delay={WRITE_END + 1.2}>
        Flagged
      </Stamp>
    </motion.div>
  </div>
);

export default GradedPaper;
