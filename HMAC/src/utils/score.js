// Scores from the API are percentages (0–100). Thresholds match the original UI:
// under 50 is fine, 50–74 is worth a look, 75+ is flagged.
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

export const isFlagged = (value) => clampScore(value) >= 75;
