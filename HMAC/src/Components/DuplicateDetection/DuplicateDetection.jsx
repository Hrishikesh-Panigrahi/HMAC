import { useState } from "react";
import ScoreRing from "../ScoreRing/ScoreRing";

// Placeholder score until this view is wired to real similarity results.
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
