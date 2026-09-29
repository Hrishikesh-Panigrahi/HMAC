import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import { Link } from "react-router-dom";

import SlidingIndicator from "../AIGeneratedContent/AIGeneratedContent";
import Stamp from "../Stamp/Stamp";
import { aiScoreOf, cropFilename, displayNameOf, needsReview } from "../../utils/submission";
import "./StudentRecord.css";

const COLUMNS = [
  { key: "student", label: "Student", sortable: true },
  { key: "file", label: "File", sortable: true },
  { key: "ai", label: "AI detection", sortable: true },
  { key: "similarity", label: "Duplicate content", sortable: true },
  { key: "verdict", label: "Verdict", sortable: false },
];

const NUMERIC = new Set(["ai", "similarity"]);

const SORT_VALUE = {
  student: (item) => displayNameOf(item).toLowerCase(),
  file: (item) => (item.filename ?? "").toLowerCase(),
  ai: (item) => aiScoreOf(item) ?? -1,
  similarity: (item) => Number(item.max_similarity) || 0,
};

const initialsOf = (name) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join("");

const SkeletonRows = () =>
  Array.from({ length: 4 }, (_, row) => (
    <tr key={row} className="ledger__row ledger__row--skeleton">
      <td>
        <div className="ledger__student">
          <span className="skeleton ledger__initials" />
          <span className="skeleton" style={{ width: 120, height: 14 }} />
        </div>
      </td>
      {[110, 170, 170, 70].map((width, col) => (
        <td key={col}>
          <span className="skeleton" style={{ display: "block", width, height: 12 }} />
        </td>
      ))}
    </tr>
  ));

const StudentRecord = ({ data, loading, hasFilters, onResetFilters }) => {
  const [sort, setSort] = useState({ key: null, direction: "asc" });

  const rows = useMemo(() => {
    if (!sort.key) return data;
    const getValue = SORT_VALUE[sort.key];
    const sorted = [...data].sort((a, b) => {
      const av = getValue(a);
      const bv = getValue(b);
      if (av < bv) return -1;
      if (av > bv) return 1;
      return 0;
    });
    return sort.direction === "asc" ? sorted : sorted.reverse();
  }, [data, sort]);

  // Numbers sort high→low first, text A→Z first; the third click clears the sort.
  const toggleSort = (key) => {
    const first = NUMERIC.has(key) ? "desc" : "asc";
    setSort((current) => {
      if (current.key !== key) return { key, direction: first };
      if (current.direction === first) return { key, direction: first === "asc" ? "desc" : "asc" };
      return { key: null, direction: "asc" };
    });
  };

  const sortIcon = (key) => {
    if (sort.key !== key) return <ArrowUpDown size={13} />;
    return sort.direction === "asc" ? <ArrowUp size={13} /> : <ArrowDown size={13} />;
  };

  if (!loading && rows.length === 0) {
    return (
      <motion.div className="ledger__empty" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
        <span className="ledger__empty-note">{hasFilters ? "nothing matches…" : "the tray is empty"}</span>
        <h3>{hasFilters ? "No submissions match" : "No submissions yet"}</h3>
        <p>
          {hasFilters ? "Try a different search or filter." : "Results appear here once students hand in their assignments."}
        </p>
        {hasFilters && (
          <button type="button" className="btn" onClick={onResetFilters}>
            Clear filters
          </button>
        )}
      </motion.div>
    );
  }

  return (
    <div className="ledger">
      <table className="ledger__table">
        <thead>
          <tr>
            {COLUMNS.map(({ key, label, sortable }) => (
              <th
                key={key}
                scope="col"
                aria-sort={sort.key === key ? (sort.direction === "asc" ? "ascending" : "descending") : undefined}
              >
                {sortable ? (
                  <button type="button" className={`ledger__sort ${sort.key === key ? "is-active" : ""}`} onClick={() => toggleSort(key)}>
                    {label}
                    {sortIcon(key)}
                  </button>
                ) : (
                  label
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <SkeletonRows />
          ) : (
            // No AnimatePresence here: nested inside the route-level one it left rows stuck at their initial state.
            rows.map((item, index) => {
              const name = displayNameOf(item);
              const aiScore = aiScoreOf(item);
              const flagged = needsReview(item);
              const rowDelay = Math.min(index, 10) * 0.06;
              return (
                <motion.tr
                  key={item.id}
                  layout="position"
                  className={`ledger__row ${flagged ? "is-flagged" : ""}`}
                  initial={{ opacity: 0, x: -14 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.35, delay: rowDelay, ease: [0.22, 1, 0.36, 1] }}
                >
                  <td data-label="Student">
                    <Link to={`/OcrResult/${item.uploaded_by.user_id}`} className="ledger__student">
                      <span className="ledger__initials" aria-hidden="true">
                        {initialsOf(name)}
                      </span>
                      <span className="ledger__student-text">
                        <strong>{name}</strong>
                        {item.uploaded_by.email && <span>{item.uploaded_by.email}</span>}
                      </span>
                    </Link>
                  </td>
                  <td data-label="File">
                    <span className="ledger__file">{cropFilename(item.filename)}</span>
                  </td>
                  <td data-label="AI detection">
                    {aiScore === undefined ? (
                      <span className="ledger__na">not scored</span>
                    ) : (
                      <SlidingIndicator label={`AI detection for ${name}`} value={aiScore.toFixed(2)} delay={0.25 + rowDelay} />
                    )}
                  </td>
                  <td data-label="Duplicate content">
                    <div className="ledger__dup">
                      <SlidingIndicator label={`Duplicate content for ${name}`} value={item.max_similarity} delay={0.35 + rowDelay} />
                      {item.other_file_names?.length > 0 && (
                        <span className="ledger__match" title="Most similar submission">
                          ↳ closest: {item.other_file_names.map(cropFilename).join(", ")}
                        </span>
                      )}
                    </div>
                  </td>
                  <td data-label="Verdict">
                    {flagged ? (
                      <Stamp size="sm" rotate={-7} delay={0.9 + rowDelay}>
                        Flagged
                      </Stamp>
                    ) : (
                      <span className="ledger__ok">looks fine ✓</span>
                    )}
                  </td>
                </motion.tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
};

export default StudentRecord;
