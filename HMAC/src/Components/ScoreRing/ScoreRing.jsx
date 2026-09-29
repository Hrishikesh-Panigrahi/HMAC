import { motion } from "framer-motion";
import CountUp from "../CountUp/CountUp";
import { clampScore, scoreTone } from "../../utils/score";
import "./ScoreRing.css";

// A hand-drawn loop that doesn't quite close, like a teacher circling a grade.
const CIRCLE_PATH = "M122 26 C 150 44, 146 96, 88 102 C 36 107, 12 84, 16 58 C 20 28, 58 12, 98 15 C 120 17, 136 26, 144 40";

const REMARK = {
  low: "looks fine",
  medium: "worth a look",
  high: "needs review!",
};

// Score written large and circled in pen, with a margin remark.
const ScoreRing = ({ value, label, caption, delay = 0.15 }) => {
  const score = clampScore(value);
  const tone = scoreTone(score);

  return (
    <div
      className={`grade grade--${tone}`}
      role="meter"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(score)}
    >
      <div className="grade__mark">
        <svg className="grade__circle" viewBox="0 0 160 118" aria-hidden="true">
          <motion.path
            d={CIRCLE_PATH}
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.9, delay: delay + 0.5, ease: [0.65, 0, 0.35, 1] }}
          />
        </svg>
        <CountUp className="grade__value" value={score} decimals={score % 1 ? 1 : 0} suffix="%" duration={1.1} delay={delay} />
      </div>
      <span className="grade__label">{label}</span>
      {caption && <span className="grade__caption">{caption}</span>}
      <motion.span
        className="grade__remark"
        initial={{ opacity: 0, y: 4, rotate: -3 }}
        animate={{ opacity: 1, y: 0, rotate: -3 }}
        transition={{ delay: delay + 1.3, duration: 0.4 }}
      >
        {REMARK[tone]}
      </motion.span>
    </div>
  );
};

export default ScoreRing;
