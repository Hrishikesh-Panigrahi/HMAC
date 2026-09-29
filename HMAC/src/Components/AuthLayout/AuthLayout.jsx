import { motion } from "framer-motion";
import PageTransition from "../PageTransition/PageTransition";
import ThemeToggle from "../ThemeToggle/ThemeToggle";
import PenUnderline from "../PenUnderline/PenUnderline";
import Sheet from "../Sheet/Sheet";
import Brand from "../Brand/Brand";
import GradedPaper from "./GradedPaper";
import "./AuthLayout.css";

const STEPS = ["Transcribe", "Detect AI", "Compare"];

const rise = (delay) => ({
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] },
});

// Split-screen shell for the login and registration pages.
const AuthLayout = ({ title, subtitle, children, footer }) => (
  <PageTransition className="auth">
    <ThemeToggle className="auth__theme" />

    <section className="auth__hero">
      <motion.div {...rise(0)}>
        <Brand />
      </motion.div>

      <div className="auth__copy">
        <motion.h1 className="auth__headline" {...rise(0.08)}>
          Every page,
          <br />
          <span className="auth__headline-accent">
            read closely.
            <PenUnderline delay={0.7} />
          </span>
        </motion.h1>

        <motion.p className="auth__lede" {...rise(0.16)}>
          HMAC transcribes handwritten assignments, estimates how likely each one is AI-written, and checks it
          against every other submission in the class.
        </motion.p>

        <motion.ol className="auth__steps" {...rise(0.24)}>
          {STEPS.map((step, index) => (
            <li key={step}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              {step}
            </li>
          ))}
        </motion.ol>
      </div>

      <GradedPaper />
    </section>

    <section className="auth__panel">
      <Sheet
        taped
        className="auth__card"
        initial={{ opacity: 0, y: 28, rotate: 2 }}
        animate={{ opacity: 1, y: 0, rotate: 0 }}
        transition={{ duration: 0.7, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="auth__mobile-brand">
          <Brand compact />
        </div>
        <header className="auth__card-header">
          <h2>{title}</h2>
          <p>{subtitle}</p>
        </header>
        {children}
        {footer && <div className="auth__footer">{footer}</div>}
      </Sheet>
    </section>
  </PageTransition>
);

export default AuthLayout;
