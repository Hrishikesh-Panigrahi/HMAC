import { useState } from "react";
import { LoaderCircle } from "lucide-react";
import "./DocumentViewer.css";

const DocumentViewer = ({ pdfUrl }) => {
  const [loaded, setLoaded] = useState(false);

  return (
    <div className="document-viewer">
      {!loaded && (
        <div className="document-viewer__loading">
          <LoaderCircle className="spin" size={22} />
          <span>Loading document…</span>
        </div>
      )}
      <iframe
        className={loaded ? "is-loaded" : ""}
        src={pdfUrl + "#toolbar=0&navpanes=0"}
        title="Document Viewer"
        onLoad={() => setLoaded(true)}
      />
    </div>
  );
};

export default DocumentViewer;
