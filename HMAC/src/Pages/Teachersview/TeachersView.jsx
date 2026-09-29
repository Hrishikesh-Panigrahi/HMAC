import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ExternalLink, LayoutDashboard } from "lucide-react";
import { Link } from "react-router-dom";
import documentUrl from "../../assets/lorem_pdf.pdf";

import PageTransition from "../../Components/PageTransition/PageTransition";
import PageHeader from "../../Components/PageHeader/PageHeader";
import Sheet from "../../Components/Sheet/Sheet";
import DocumentViewer from "../../Components/DocumentViewer/DocumentViewer";
import ScoreRing from "../../Components/ScoreRing/ScoreRing";
import DuplicateDetection from "../../Components/DuplicateDetection/DuplicateDetection";
import "./TeachersView.css";

const TABS = [
  { id: "result", label: "Result" },
  { id: "explanation", label: "Explanation" },
];

// Flipping between tabs feels like turning a page.
const tabPanel = {
  initial: { opacity: 0, x: 18, rotate: 0.6 },
  animate: { opacity: 1, x: 0, rotate: 0 },
  exit: { opacity: 0, x: -18, rotate: -0.6 },
};

const TeachersView = () => {
  const [tab, setTab] = useState("result");

  return (
    <PageTransition className="page">
      <PageHeader
        index="02"
        eyebrow="Professor workspace"
        title="Review the"
        accent="submission."
        subtitle="Read the document side by side with its AI and duplicate-content scores."
        actions={
          <Link to="/Summary" className="btn">
            <LayoutDashboard size={16} />
            All submissions
          </Link>
        }
      />

      <div className="review-grid">
        <Sheet
          className="review-doc"
          initial={{ opacity: 0, x: -24, rotate: -2 }}
          animate={{ opacity: 1, x: 0, rotate: -0.4 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        >
          <span className="review-doc__clip" aria-hidden="true" />
          <div className="sheet__header">
            <span className="sheet__title">
              <span className="review-doc__name">pdfname.pdf</span>
            </span>
            <a className="btn btn-ghost" href={documentUrl} target="_blank" rel="noreferrer">
              <ExternalLink size={16} />
              Open
            </a>
          </div>
          <div className="sheet__body">
            <DocumentViewer pdfUrl={documentUrl} />
          </div>
        </Sheet>

        <motion.div
          className="review-folder"
          initial={{ opacity: 0, x: 24, rotate: 2 }}
          animate={{ opacity: 1, x: 0, rotate: 0.3 }}
          transition={{ duration: 0.6, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="folder-tabs" role="tablist" aria-label="Analysis view">
            {TABS.map(({ id, label }) => (
              <button
                key={id}
                type="button"
                role="tab"
                aria-selected={tab === id}
                className={`folder-tab ${tab === id ? "is-active" : ""}`}
                onClick={() => setTab(id)}
              >
                {label}
              </button>
            ))}
          </div>

          <Sheet className="review-panel">
            <AnimatePresence mode="wait" initial={false}>
              {tab === "result" ? (
                <motion.div key="result" role="tabpanel" className="review-result" {...tabPanel} transition={{ duration: 0.25 }}>
                  <dl className="review-meta">
                    <div>
                      <dt>PDF name</dt>
                      <dd className="mono">pdfname.pdf</dd>
                    </div>
                    <div>
                      <dt>Description</dt>
                      <dd>
                        Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been
                        the industry&apos;s standard dummy text ever since the 1500s.
                      </dd>
                    </div>
                  </dl>

                  <div className="review-scores">
                    <ScoreRing value={50} label="AI-generated" caption="Likelihood it's AI-written" delay={0.2} />
                    <DuplicateDetection delay={0.4} />
                  </div>
                </motion.div>
              ) : (
                <motion.div key="explanation" role="tabpanel" className="review-explain" {...tabPanel} transition={{ duration: 0.25 }}>
                  <section>
                    <h3>
                      <span className="review-explain__num">1</span>
                      AI-generated content
                    </h3>
                    <p>
                      The transcribed text is scored by a DistilBERT classifier trained to tell human and AI writing
                      apart. The number is its probability that the text is AI-written.
                    </p>
                  </section>
                  <section>
                    <h3>
                      <span className="review-explain__num">2</span>
                      Duplicate detection
                    </h3>
                    <p>
                      The answer is compared with every other answer to the same assignment, looking for runs of four
                      or more matching words (one may differ, so OCR slips don&apos;t hide copying). The number is the
                      share of its phrases found in the closest match.
                      Wording from the question paper, and phrases most of the class uses, are ignored, so answering
                      the same question in similar words doesn&apos;t count.
                    </p>
                  </section>
                  <div className="review-explain__legend">
                    <span className="review-explain__legend-label">AI</span>
                    <span className="hl hl--green">under 50% · low</span>
                    <span className="hl">50–74% · worth a look</span>
                    <span className="hl hl--pink">75%+ · flagged</span>
                  </div>
                  <div className="review-explain__legend">
                    <span className="review-explain__legend-label">Duplicate</span>
                    <span className="hl hl--green">under 20% · low</span>
                    <span className="hl">20–34% · worth a look</span>
                    <span className="hl hl--pink">35%+ (or 25%+ at 3× the class median) · flagged</span>
                  </div>
                  <p className="review-explain__note">
                    Scores are signals, not verdicts. Read the transcription before acting on a high score.
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </Sheet>
        </motion.div>
      </div>
    </PageTransition>
  );
};

export default TeachersView;
