// Scores from the API are percentages (0–100). The API also sends a level for each score
// (ai_level, similarity_level), set by the backend's calibration; prefer it. These 50/75
// thresholds are only a fallback for scores without one.
export const clampScore = (value) => {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return 0;
  return Math.min(Math.max(numeric, 0), 100);
};

export const scoreTone = (value) => {
  const score = clampScore(value);
  if (score >= 75) return "high";
  if (score >= 50) return "medium";
  return "low";
};

export const TONE_LABEL = {
  low: "Low",
  medium: "Medium",
  high: "High",
};
