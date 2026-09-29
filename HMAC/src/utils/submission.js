import { isFlagged } from "./score";

// Helpers for rows returned by GET /api/v1/teacher/files/.

export const aiScoreOf = (item) => {
  const value = item.user_aidetection_results?.[0]?.detection_results_AI;
  return value === null || value === undefined ? undefined : Number(value);
};

export const displayNameOf = (item) => {
  const user = item.uploaded_by ?? {};
  return user.full_name || user.username || user.email || "Unknown student";
};

export const cropFilename = (filename = "") => {
  const index = filename.indexOf(".");
  return index !== -1 ? filename.substring(0, index) : filename;
};

export const needsReview = (item) => isFlagged(aiScoreOf(item)) || isFlagged(item.max_similarity);
