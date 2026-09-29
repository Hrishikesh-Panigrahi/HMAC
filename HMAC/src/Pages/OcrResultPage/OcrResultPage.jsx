import { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, Check, Copy, RefreshCw } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { toast } from "sonner";

import PageTransition from "../../Components/PageTransition/PageTransition";
import Sheet from "../../Components/Sheet/Sheet";
import "./OcrResult.css";

// Word-by-word "writing" reveal is only used for texts short enough that it stays quick.
const MAX_ANIMATED_WORDS = 600;

const textVariants = {
  animate: { transition: { staggerChildren: 0.018, delayChildren: 0.35 } },
};

const wordVariants = {
  initial: { opacity: 0, y: 4, filter: "blur(3px)" },
  animate: { opacity: 1, y: 0, filter: "blur(0px)", transition: { duration: 0.3 } },
};

const OcrResultPage = () => {
  const { id } = useParams();
  const [ocrData, setOcrData] = useState(null);
  const [status, setStatus] = useState("loading"); // loading | ready | error
  const [copied, setCopied] = useState(false);

  const fetchOcrResult = useCallback(async () => {
    setStatus("loading");
    try {
      const response = await axios.get(`http://localhost:8000/api/v1/results/${id}`);
      if (response.status === 200) {
        setOcrData(response.data);
        setStatus("ready");
      } else {
        console.error("Error fetching data:", response.statusText);
        setStatus("error");
      }
    } catch (error) {
      console.error("Network error:", error);
      setStatus("error");
    }
  }, [id]);

  useEffect(() => {
    fetchOcrResult();
  }, [fetchOcrResult]);

  const text = ocrData?.ocr_results ?? "";
  const words = useMemo(() => text.split(/\s+/).filter(Boolean), [text]);
  const readMinutes = Math.max(1, Math.round(words.length / 200));

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast.success("Copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Couldn't copy", { description: "Your browser blocked clipboard access." });
    }
  };

  return (
    <PageTransition className="page ocr">
      <Link to="/Summary" className="btn btn-ghost ocr__back">
        <ArrowLeft size={16} />
        Back to summary
      </Link>

      {status === "loading" && (
        <div className="sheet ocr__sheet" aria-busy="true" aria-label="Loading OCR result">
          <div className="ocr__head">
            <div style={{ display: "grid", gap: 12, flex: 1 }}>
              <span className="skeleton" style={{ width: 120, height: 12 }} />
              <span className="skeleton" style={{ width: "50%", height: 36 }} />
              <span className="skeleton" style={{ width: "30%", height: 12 }} />
            </div>
          </div>
          <div className="ocr__body" style={{ display: "grid", gap: 20 }}>
            {[100, 94, 97, 88, 60].map((w, i) => (
              <span key={i} className="skeleton" style={{ width: `${w}%`, height: 14 }} />
            ))}
          </div>
        </div>
      )}

      {status === "error" && (
        <Sheet
          taped
          className="ocr__error"
          role="alert"
          initial={{ opacity: 0, y: 14, rotate: -1 }}
          animate={{ opacity: 1, y: 0, rotate: -0.4 }}
        >
          <span className="ocr__error-note">no transcription here…</span>
          <h2>Couldn&apos;t load this OCR result</h2>
          <p>The server didn&apos;t return a transcription for this student. It may not have been processed yet.</p>
          <button type="button" className="btn btn-primary" onClick={fetchOcrResult}>
            <RefreshCw size={16} />
            Try again
          </button>
        </Sheet>
      )}

      {status === "ready" && ocrData && (
        <Sheet
          className="ocr__sheet"
          initial={{ opacity: 0, y: 30, rotate: -1.5 }}
          animate={{ opacity: 1, y: 0, rotate: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="ocr__head">
            <div className="ocr__title">
              <span className="eyebrow">
                <span className="eyebrow__index">№ {ocrData.id}</span>
                OCR result
              </span>
              <h1>Transcribed text</h1>
              <p>
                Handed in by <strong>{ocrData.uploaded_by}</strong>
              </p>
            </div>
            <button type="button" className="btn" onClick={handleCopy} disabled={!text}>
              <AnimatePresence mode="wait" initial={false}>
                <motion.span
                  key={copied ? "copied" : "copy"}
                  initial={{ opacity: 0, scale: 0.6 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.6 }}
                  style={{ display: "grid" }}
                >
                  {copied ? <Check size={16} /> : <Copy size={16} />}
                </motion.span>
              </AnimatePresence>
              {copied ? "Copied" : "Copy text"}
            </button>
          </div>

          <dl className="ocr__stats">
            <div>
              <dt>Words</dt>
              <dd>{words.length}</dd>
            </div>
            <div>
              <dt>Characters</dt>
              <dd>{text.length}</dd>
            </div>
            <div>
              <dt>Reading time</dt>
              <dd>{readMinutes} min</dd>
            </div>
          </dl>

          <div className="ocr__body sheet--ruled">
            {!text ? (
              <p className="ocr__empty">No text was recognised in this submission.</p>
            ) : words.length <= MAX_ANIMATED_WORDS ? (
              <motion.p className="ocr__text" variants={textVariants} initial="initial" animate="animate">
                {words.map((word, index) => (
                  <motion.span key={index} variants={wordVariants}>
                    {word}{" "}
                  </motion.span>
                ))}
              </motion.p>
            ) : (
              <p className="ocr__text">{text}</p>
            )}
          </div>
        </Sheet>
      )}
    </PageTransition>
  );
};

export default OcrResultPage;
