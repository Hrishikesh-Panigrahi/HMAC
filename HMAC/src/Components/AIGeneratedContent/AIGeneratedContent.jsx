import { motion } from "framer-motion";
import CountUp from "../CountUp/CountUp";
import { clampScore, scoreTone } from "../../utils/score";
import "./AIGeneratedContent.css";

// Score as a highlighter stroke swiped across a dotted baseline.
const SlidingIndicator = ({ value, label = "Score", delay = 0 }) => {
  const score = clampScore(value);
  const tone = scoreTone(score);

  return (
    <div
      className={`meter meter--${tone}`}
      role="meter"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(score)}
    >
      <div className="meter__track">
        <motion.div
          className="meter__stroke"
          initial={{ width: 0 }}
          animate={{ width: `${Math.max(score, 2)}%` }}
          transition={{ duration: 0.8, delay, ease: [0.3, 0.9, 0.3, 1] }}
        />
      </div>
      <CountUp className="meter__value" value={score} decimals={1} suffix="%" duration={0.8} delay={delay} />
    </div>
  );
};

export default SlidingIndicator;
