import { useEffect, useState } from "react";
import axios from "axios";
import { motion } from "framer-motion";
import { LoaderCircle } from "lucide-react";

import Modal from "../Modal/Modal";
import { API_BASE, authHeaders } from "../../utils/api";
import { cropFilename, userNameOf } from "../../utils/submission";
import "./CompareModal.css";

// Split text into plain and marked pieces from sorted [start, end] spans.
const segments = (text, spans) => {
  const pieces = [];
  let cursor = 0;
  for (const [start, end] of spans) {
    if (start > cursor) pieces.push({ text: text.slice(cursor, start), marked: false });
    pieces.push({ text: text.slice(start, end), marked: true });
    cursor = end;
  }
  if (cursor < text.length) pieces.push({ text: text.slice(cursor), marked: false });
  return pieces;
};

const MarkedText = ({ text, spans, delay = 0 }) => {
  let markIndex = 0;
  return (
    <p className="compare__text">
      {segments(text, spans).map((piece, index) =>
        piece.marked ? (
          <motion.mark
            key={index}
            initial={{ backgroundSize: "0% 72%" }}
            animate={{ backgroundSize: "100% 72%" }}
            transition={{ duration: 0.45, delay: delay + 0.08 * markIndex++, ease: [0.3, 0.9, 0.3, 1] }}
          >
            {piece.text}
          </motion.mark>
        ) : (
          <span key={index}>{piece.text}</span>
        )
      )}
    </p>
  );
};

// Side-by-side view of a submission and its closest matches, shared passages highlighted.
const CompareModal = ({ row, onClose }) => {
  const [data, setData] = useState(null);
  const [status, setStatus] = useState("loading");
  const [active, setActive] = useState(0);

  useEffect(() => {
    if (!row) return;
    let cancelled = false;
    setStatus("loading");
    setActive(0);
    axios
      .get(`${API_BASE}/submissions/${row.id}/similarity/`, { headers: authHeaders() })
      .then((response) => {
        if (cancelled) return;
        setData(response.data);
        setStatus("ready");
      })
      .catch(() => !cancelled && setStatus("error"));
    return () => {
      cancelled = true;
    };
  }, [row]);

  const name = row ? userNameOf(row.uploaded_by) : "";
  const match = data?.matches?.[active];

  return (
    <Modal
      open={Boolean(row)}
      onClose={onClose}
      className="compare"
      labelledBy="compare-title"
      eyebrow={
        <>
          <span className="eyebrow__index">≈</span>
          Duplicate check
        </>
      }
      title={`${name}'s answer, compared`}
    >
      {status === "loading" && (
        <div className="compare__loading">
          <LoaderCircle className="spin" size={22} />
          Lining up the answers…
        </div>
      )}

      {status === "error" && <p className="compare__empty">Couldn&apos;t load the comparison. Try again in a moment.</p>}

      {status === "ready" && !match && (
        <p className="compare__empty">No shared passages with any other submission for this assignment.</p>
      )}

      {status === "ready" && match && (
        <>
          {data.matches.length > 1 && (
            <div className="compare__tabs" role="tablist" aria-label="Closest matches">
              {data.matches.map((m, index) => (
                <button
                  key={m.id}
                  type="button"
                  role="tab"
                  aria-selected={index === active}
                  className={`compare__tab ${index === active ? "is-active" : ""}`}
                  onClick={() => setActive(index)}
                >
                  {userNameOf(m.uploaded_by)} · {m.similarity.toFixed(1)}%
                </button>
              ))}
            </div>
          )}

          <p className="compare__summary">
            <strong>{match.similarity.toFixed(1)}%</strong> of {name}&apos;s phrases also appear in{" "}
            {userNameOf(match.uploaded_by)}&apos;s answer, across {match.spans.length}{" "}
            {match.spans.length === 1 ? "passage" : "passages"}.
          </p>

          <div className="compare__columns" key={match.id}>
            <section className="compare__column">
              <header>
                <strong>{name}</strong>
                <span>{cropFilename(data.filename)}</span>
              </header>
              <MarkedText text={data.text} spans={match.spans} delay={0.2} />
            </section>
            <section className="compare__column">
              <header>
                <strong>{userNameOf(match.uploaded_by)}</strong>
                <span>{cropFilename(match.filename)}</span>
              </header>
              <MarkedText text={match.other_text} spans={match.other_spans} delay={0.35} />
            </section>
          </div>

          <p className="compare__note">
            Matches are runs of four or more words, and one word may differ so OCR slips don&apos;t hide copying.
            Phrases from the question paper, and ones most of the class uses, are ignored.
          </p>
        </>
      )}
    </Modal>
  );
};

export default CompareModal;
