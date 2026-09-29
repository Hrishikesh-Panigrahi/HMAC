import { motion } from "framer-motion";
import PenUnderline from "../PenUnderline/PenUnderline";
import "./PageHeader.css";

const rise = (delay) => ({
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.55, delay, ease: [0.22, 1, 0.36, 1] },
});

// Section index + serif title whose last word gets a red-pen underline.
const PageHeader = ({ index, eyebrow, title, accent, subtitle, actions }) => (
  <header className="page-header">
    <div className="page-header__text">
      <motion.span className="eyebrow" {...rise(0)}>
        {index && <span className="eyebrow__index">{index}</span>}
        {eyebrow}
      </motion.span>
      <motion.h1 className="page-title" {...rise(0.06)}>
        {title}{" "}
        {accent && (
          <span className="page-title__accent">
            {accent}
            <PenUnderline delay={0.5} />
          </span>
        )}
      </motion.h1>
      {subtitle && (
        <motion.p className="page-subtitle" {...rise(0.12)}>
          {subtitle}
        </motion.p>
      )}
    </div>
    {actions && (
      <motion.div className="page-header__actions" {...rise(0.18)}>
        {actions}
      </motion.div>
    )}
  </header>
);

export default PageHeader;
