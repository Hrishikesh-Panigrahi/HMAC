import { motion } from "framer-motion";
import Modal from "../Modal/Modal";
import "./HowItWorks.css";

const STEPS = [
  { title: "Upload a PDF", text: "Students pick the assignment and upload a scanned, handwritten answer." },
  { title: "Handwriting is read", text: "The first page is turned into an image and transcribed with OCR." },
  { title: "AI detection", text: "A DistilBERT classifier estimates how likely the text is AI-generated." },
  {
    title: "Duplicate check",
    text: "The answer is compared with the others for the same assignment, looking for shared 4-word phrases (one word may differ, for OCR slips). Phrases from the question paper, and ones most of the class uses, are ignored.",
  },
  { title: "Review", text: "Professors see every score in the Summary, and can compare the matching passages side by side." },
];

const listVariants = {
  animate: { transition: { staggerChildren: 0.07, delayChildren: 0.15 } },
};

const itemVariants = {
  initial: { opacity: 0, x: -10 },
  animate: { opacity: 1, x: 0, transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] } },
};

const HowItWorks = ({ open, onClose }) => (
  <Modal
    open={open}
    onClose={onClose}
    labelledBy="how-it-works-title"
    eyebrow={
      <>
        <span className="eyebrow__index">?</span>
        How to use
      </>
    }
    title="How HMAC checks an assignment"
  >
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
      <span className="modal__swatch modal__swatch--low">low</span>
      <span className="modal__swatch modal__swatch--medium">worth a look</span>
      <span className="modal__swatch modal__swatch--high">flagged</span>
    </footer>
  </Modal>
);

export default HowItWorks;
