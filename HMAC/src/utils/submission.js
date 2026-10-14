// Helpers for rows returned by GET /api/v1/teacher/files/.

export const aiScoreOf = (item) =>
  item.ai_score === null || item.ai_score === undefined ? undefined : Number(item.ai_score);

export const userNameOf = (user) =>
  (user && (user.full_name || user.username || user.email)) || "Unknown student";

export const displayNameOf = (item) => userNameOf(item.uploaded_by);

export const cropFilename = (filename = "") => {
  const index = filename.indexOf(".");
  return index !== -1 ? filename.substring(0, index) : filename;
};

// The backend grades both scores (similarity_level against the class, ai_level against the
// detector's calibration). AI scores on very short answers aren't trusted enough to flag on their own.
export const needsReview = (item) =>
  item.similarity_level === "high" || (item.ai_confidence !== "low" && item.ai_level === "high");
