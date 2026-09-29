import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import "./HowItWorks.css";

const STEPS = [
  { title: "Upload a PDF", text: "Students upload a scanned, handwritten assignment." },
  { title: "Handwriting is read", text: "Each page is turned into an image and transcribed with OCR." },
  { title: "AI detection", text: "A DistilBERT classifier estimates how likely the text is AI-generated." },
  { title: "Similarity check", text: "The text is compared with every other submission to find the closest match." },
  { title: "Review", text: "Professors see every score in the Summary and can open the transcribed text." },
];

const listVariants = {
  animate: { transition: { staggerChildren: 0.07, delayChildren: 0.15 } },
};

const itemVariants = {
  initial: { opacity: 0, x: -10 },
  animate: { opacity: 1, x: 0, transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] } },
};

const HowItWorks = ({ open, onClose }) => {
  const closeRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const previouslyFocused = document.activeElement;
    const onKey = (e) => e.key === "Escape" && onClose();
    const { overflow } = document.body.style;

    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();

    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
      previouslyFocused?.focus?.();
    };
  }, [open, onClose]);

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          className="modal__backdrop"
          onClick={onClose}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="sheet sheet--taped modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="how-it-works-title"
            onClick={(e) => e.stopPropagation()}
            initial={{ opacity: 0, y: 40, rotate: -3 }}
            animate={{ opacity: 1, y: 0, rotate: -0.6 }}
            exit={{ opacity: 0, y: 30, rotate: 2 }}
            transition={{ type: "spring", stiffness: 300, damping: 26 }}
          >
            <header className="modal__header">
              <div>
                <span className="eyebrow">
                  <span className="eyebrow__index">?</span>
                  How to use
                </span>
                <h2 id="how-it-works-title">How HMAC checks an assignment</h2>
              </div>
              <button ref={closeRef} type="button" className="btn btn-ghost btn-icon" onClick={onClose} aria-label="Close">
                <X size={20} />
              </button>
            </header>

            <motion.ol className="steps" variants={listVariants} initial="initial" animate="animate">
              {STEPS.map(({ title, text }, index) => (
                <motion.li key={title} className="steps__item" variants={itemVariants}>
                  <span className="steps__number">{index + 1}</span>
                  <span className="steps__text">
                    <strong>{title}</strong>
                    <span>{text}</span>
                  </span>
                </motion.li>
              ))}
            </motion.ol>

            <footer className="modal__legend">
              <span className="modal__swatch modal__swatch--low">under 50% · low</span>
              <span className="modal__swatch modal__swatch--medium">50–74% · medium</span>
              <span className="modal__swatch modal__swatch--high">75%+ · flagged</span>
            </footer>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
};

export default HowItWorks;
