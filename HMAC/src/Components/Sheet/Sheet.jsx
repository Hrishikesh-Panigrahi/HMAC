import { motion } from "framer-motion";

// A sheet of paper: ink border, hard shadow. `taped` adds a strip of tape, `ruled` notebook lines.
const Sheet = ({ className = "", taped = false, ruled = false, children, ...motionProps }) => (
  <motion.div
    className={`sheet ${taped ? "sheet--taped" : ""} ${ruled ? "sheet--ruled" : ""} ${className}`}
    {...motionProps}
  >
    {children}
  </motion.div>
);

export default Sheet;
