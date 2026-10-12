import { useState } from "react";
import ScoreRing from "../ScoreRing/ScoreRing";

// TODO(roadmap:real-review-page): placeholder score until the Review page shows a real submission.
const getRandomInitialValue = () => Math.floor(Math.random() * 101);

const DuplicateDetection = ({ delay }) => {
  const [duplicateRate] = useState(getRandomInitialValue);

  return (
    <ScoreRing
      value={duplicateRate}
      label="Duplicate detection"
      caption="Overlap with other submissions"
      delay={delay}
    />
  );
};

export default DuplicateDetection;
