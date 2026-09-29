import { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import { motion } from "framer-motion";
import { LogIn, Plus, RefreshCw, Search, X } from "lucide-react";
import { Link } from "react-router-dom";

import PageTransition from "../../Components/PageTransition/PageTransition";
import PageHeader from "../../Components/PageHeader/PageHeader";
import Sheet from "../../Components/Sheet/Sheet";
import CountUp from "../../Components/CountUp/CountUp";
import Annotation from "../../Components/Annotation/Annotation";
import StudentRecord from "../../Components/StudentRecord/StudentRecord";
import CompareModal from "../../Components/CompareModal/CompareModal";
import NewAssignmentModal from "../../Components/NewAssignmentModal/NewAssignmentModal";
import { API_BASE, authHeaders, isAuthError } from "../../utils/api";
import { aiScoreOf, displayNameOf, needsReview } from "../../utils/submission";
import "./SubmissionSummary.css";

const FILTERS = [
  { id: "all", label: "All" },
  { id: "flagged", label: "Needs review" },
  { id: "clear", label: "Looks fine" },
];

// Index cards are pinned at slightly different angles.
const CARD_TILT = [-1.4, 0.9, -0.6, 1.3];

const average = (values) => (values.length ? values.reduce((sum, v) => sum + v, 0) / values.length : 0);

const SubmissionSummary = () => {
  const [data, setData] = useState([]);
  const [status, setStatus] = useState("loading"); // loading | ready | error | unauthorized
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [assignments, setAssignments] = useState([]);
  const [assignment, setAssignment] = useState("all"); // "all" | "none" | assignment id
  const [comparing, setComparing] = useState(null);
  const [creating, setCreating] = useState(false);

  const fetchStudentRecords = useCallback(async () => {
    setStatus("loading");
    try {
      // The endpoint is staff-only; authenticate with the JWT saved at login.
      const response = await axios.get(`${API_BASE}/teacher/files/`, {
        headers: authHeaders(),
        params: assignment === "all" ? {} : { assignment },
      });
      if (response.status === 200) {
        setData(response.data.file_data ?? []);
        setStatus("ready");
      } else {
        console.error("Error fetching data:", response.statusText);
        setStatus("error");
      }
    } catch (error) {
      if (isAuthError(error)) {
        setStatus("unauthorized");
        return;
      }
      console.error("Network error:", error);
      setStatus("error");
    }
  }, [assignment]);

  const fetchAssignments = useCallback(() => {
    axios
      .get(`${API_BASE}/assignments/`, { headers: authHeaders() })
      .then((response) => setAssignments(response.data))
      .catch(() => setAssignments([]));
  }, []);

  useEffect(() => {
    fetchStudentRecords();
  }, [fetchStudentRecords]);

  useEffect(() => {
    fetchAssignments();
  }, [fetchAssignments]);

  const handleCreated = (created) => {
    setCreating(false);
    fetchAssignments();
    setAssignment(String(created.id));
  };

  const closeCompare = useCallback(() => setComparing(null), []);
  const closeCreate = useCallback(() => setCreating(false), []);

  const flaggedCount = useMemo(() => data.filter(needsReview).length, [data]);

  const stats = useMemo(() => {
    const aiScores = data.map(aiScoreOf).filter((v) => Number.isFinite(v));
    const similarities = data.map((item) => Number(item.max_similarity)).filter((v) => Number.isFinite(v));
    return [
      { label: "Submissions", value: data.length, decimals: 0, suffix: "" },
      { label: "Avg. AI likelihood", value: average(aiScores), decimals: 1, suffix: "%" },
      { label: "Avg. closest match", value: average(similarities), decimals: 1, suffix: "%" },
      { label: "Need review", value: flaggedCount, decimals: 0, suffix: "", alert: true },
    ];
  }, [data, flaggedCount]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return data.filter((item) => {
      if (filter === "flagged" && !needsReview(item)) return false;
      if (filter === "clear" && needsReview(item)) return false;
      if (!q) return true;
      const haystack = [displayNameOf(item), item.uploaded_by?.email, item.filename].join(" ").toLowerCase();
      return haystack.includes(q);
    });
  }, [data, query, filter]);

  const resetFilters = () => {
    setQuery("");
    setFilter("all");
  };

  return (
    <PageTransition className="page">
      <PageHeader
        index="03"
        eyebrow="Professor workspace"
        title="Submission"
        accent="summary."
        subtitle="AI-detection and duplicate-content results. Answers are only compared with others for the same assignment."
        actions={
          <>
            <label className="select summary-assignment">
              <span className="label">Assignment</span>
              <select value={assignment} onChange={(e) => setAssignment(e.target.value)}>
                <option value="all">All assignments</option>
                {assignments.map((a) => (
                  <option key={a.id} value={String(a.id)}>
                    {a.title}
                  </option>
                ))}
                <option value="none">No assignment (older uploads)</option>
              </select>
            </label>
            <button type="button" className="btn" onClick={() => setCreating(true)}>
              <Plus size={16} />
              New assignment
            </button>
            <button
              type="button"
              className="btn btn-ghost btn-icon"
              onClick={fetchStudentRecords}
              disabled={status === "loading"}
              aria-label="Refresh"
              title="Refresh"
            >
              <RefreshCw size={16} className={status === "loading" ? "spin" : ""} />
            </button>
          </>
        }
      />

      <section className="stats" aria-label="Overview">
        {stats.map(({ label, value, decimals, suffix, alert }, index) => (
          <Sheet
            key={label}
            className={`stat ${alert ? "stat--alert" : ""}`}
            initial={{ opacity: 0, y: 30, rotate: CARD_TILT[index] * 3 }}
            animate={{ opacity: 1, y: 0, rotate: CARD_TILT[index] }}
            whileHover={{ rotate: 0, y: -4 }}
            transition={{ type: "spring", stiffness: 220, damping: 20, delay: 0.06 * index }}
          >
            <span className="stat__label">{label}</span>
            {status === "loading" && <span className="skeleton stat__skeleton" />}
            {status === "ready" && (
              <CountUp className="stat__value" value={value} decimals={decimals} suffix={suffix} delay={0.15 + 0.1 * index} />
            )}
            {(status === "error" || status === "unauthorized") && <span className="stat__value stat__value--empty">—</span>}
            {alert && status === "ready" && flaggedCount > 0 && (
              <Annotation className="stat__note" rotate={-7} delay={1.2}>
                check these first
              </Annotation>
            )}
          </Sheet>
        ))}
      </section>

      {status === "unauthorized" ? (
        <Sheet
          taped
          className="summary-error"
          initial={{ opacity: 0, y: 16, rotate: -1 }}
          animate={{ opacity: 1, y: 0, rotate: -0.5 }}
          role="alert"
        >
          <span className="summary-error__note">professors only</span>
          <h2>Sign in to see submissions</h2>
          <p>The summary is only available to professor accounts. If you were signed in, your session may have expired.</p>
          <Link to="/" className="btn btn-primary">
            <LogIn size={16} />
            Sign in
          </Link>
        </Sheet>
      ) : status === "error" ? (
        <Sheet
          taped
          className="summary-error"
          initial={{ opacity: 0, y: 16, rotate: -1 }}
          animate={{ opacity: 1, y: 0, rotate: -0.5 }}
          role="alert"
        >
          <span className="summary-error__note">Hmm, nothing came back.</span>
          <h2>Couldn&apos;t load submissions</h2>
          <p>The server didn&apos;t respond. Make sure the API is running, then try again.</p>
          <button type="button" className="btn btn-primary" onClick={fetchStudentRecords}>
            <RefreshCw size={16} />
            Try again
          </button>
        </Sheet>
      ) : (
        <Sheet
          className="summary-table"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.25, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="summary-toolbar">
            <label className="search">
              <Search size={17} aria-hidden="true" />
              <span className="sr-only">Search submissions</span>
              <input
                type="search"
                placeholder="Search student or file…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              {query && (
                <button type="button" className="search__clear" onClick={() => setQuery("")} aria-label="Clear search">
                  <X size={15} />
                </button>
              )}
            </label>

            <div className="filters" role="radiogroup" aria-label="Filter submissions">
              {FILTERS.map(({ id, label }) => (
                <button
                  key={id}
                  type="button"
                  role="radio"
                  aria-checked={filter === id}
                  className={`filter ${filter === id ? "is-active" : ""}`}
                  onClick={() => setFilter(id)}
                >
                  {filter === id && (
                    <motion.span layoutId="summary-filter" className="filter__mark" transition={{ type: "spring", stiffness: 420, damping: 34 }} />
                  )}
                  {label}
                </button>
              ))}
            </div>
          </div>

          <StudentRecord
            data={visible}
            loading={status === "loading"}
            hasFilters={Boolean(query) || filter !== "all"}
            onResetFilters={resetFilters}
            onCompare={setComparing}
          />
        </Sheet>
      )}

      <CompareModal row={comparing} onClose={closeCompare} />
      <NewAssignmentModal open={creating} onClose={closeCreate} onCreated={handleCreated} />
    </PageTransition>
  );
};

export default SubmissionSummary;
