import { useRef, useState } from "react";
import axios from "axios";
import { AnimatePresence, motion } from "framer-motion";
import { LoaderCircle, RefreshCw, Send, Trash } from "lucide-react";
import { toast } from "sonner";

import PageTransition from "../PageTransition/PageTransition";
import PageHeader from "../PageHeader/PageHeader";
import Sheet from "../Sheet/Sheet";
import Stamp from "../Stamp/Stamp";
import Annotation from "../Annotation/Annotation";
import InputWithLabel from "../InputWithLabel/InputWithLabel";
import "./Student.css";

const DESCRIPTION_LIMIT = 500;

const formatBytes = (bytes) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const isPdf = (file) => file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");

// Turns a DRF error body ({ field: ["msg"] }) into one readable line.
const describeUploadError = (err) => {
  if (!err.response) return "Couldn't reach the server. Check your connection and try again.";
  const data = err.response.data;
  if (data && typeof data === "object") {
    return Object.entries(data)
      .map(([field, messages]) => `${field}: ${[].concat(messages).join(" ")}`)
      .join(" · ");
  }
  return `The server responded with ${err.response.status}.`;
};

// Little stack of paper used as the dropzone illustration.
const PaperStack = ({ lifted }) => (
  <motion.div
    className="paper-stack"
    animate={lifted ? { y: -10, rotate: -6, scale: 1.06 } : { y: [0, -5, 0], rotate: -2, scale: 1 }}
    transition={lifted ? { type: "spring", stiffness: 300, damping: 18 } : { duration: 3.2, repeat: Infinity, ease: "easeInOut" }}
    aria-hidden="true"
  >
    <span className="paper-stack__sheet paper-stack__sheet--back" />
    <span className="paper-stack__sheet">
      <i />
      <i />
      <i />
      <i />
    </span>
  </motion.div>
);

const Checklist = ({ steps, current }) => (
  <ol className="checklist" aria-label="Progress">
    {steps.map((step, index) => (
      <li
        key={step.label}
        className={`checklist__item ${step.done ? "is-done" : ""} ${index === current ? "is-current" : ""}`}
      >
        <span className="checklist__box">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <motion.path
              d="M4 13 L10 19 L21 4"
              initial={false}
              animate={{ pathLength: step.done ? 1 : 0, opacity: step.done ? 1 : 0 }}
              transition={{ duration: 0.35, ease: "easeOut" }}
            />
          </svg>
        </span>
        <span className="checklist__label">{step.label}</span>
      </li>
    ))}
  </ol>
);

const Student = () => {
  const [selectedFile, setSelectedFile] = useState("");
  const [desc, setDesc] = useState("");
  const renameInputRef = useRef(null);
  const fileInputRef = useRef(null);
  const [isValid, setIsValid] = useState(true);
  const [file, setFile] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [status, setStatus] = useState("idle"); // idle | uploading | success
  const [progress, setProgress] = useState(0);
  const [attempted, setAttempted] = useState(false);

  const acceptFile = (candidate) => {
    if (!candidate) return;
    if (!isPdf(candidate)) {
      toast.error("That isn't a PDF", { description: "Only .pdf files can be submitted." });
      return;
    }
    setFile(candidate);
    setSelectedFile(candidate.name);
    setIsValid(true);
  };

  const handleFileChange = (e) => {
    acceptFile(e.target.files[0]);
    e.target.value = "";
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragActive(false);
    acceptFile(e.dataTransfer.files[0]);
  };

  const handleDrag = (e) => {
    e.preventDefault();
    if (e.type === "dragenter" || e.type === "dragover") setDragActive(true);
    // Ignore dragleave events fired when moving over child elements.
    if (e.type === "dragleave" && !e.currentTarget.contains(e.relatedTarget)) setDragActive(false);
  };

  const openFilePicker = () => fileInputRef.current?.click();

  const removeFile = (e) => {
    e.stopPropagation();
    setFile(null);
    setSelectedFile("");
    setIsValid(true);
  };

  const handleRenameInputFocus = () => {
    const inputElement = renameInputRef.current;
    const indexOfExtension = selectedFile.lastIndexOf(".pdf");

    if (inputElement && indexOfExtension > 0) {
      inputElement.setSelectionRange(0, indexOfExtension);
    }
  };

  const reset = () => {
    setFile(null);
    setSelectedFile("");
    setDesc("");
    setIsValid(true);
    setProgress(0);
    setAttempted(false);
    setStatus("idle");
  };

  const handleUpload = (e) => {
    e.preventDefault();
    setAttempted(true);

    if (!file) {
      toast.error("Choose a PDF first");
      return;
    }
    if (!isValid) {
      toast.error("Fix the file name", { description: "It must end with .pdf" });
      return;
    }
    if (!desc.trim()) {
      toast.error("Add a short description");
      return;
    }

    // Field names must match FileModelSerializer (filename, description, file).
    const formData = new FormData();
    formData.append("filename", selectedFile);
    formData.append("description", desc);
    formData.append("file", file);

    setStatus("uploading");
    setProgress(0);

    axios
      .post("http://localhost:8000/api/v1/Upload/", formData, {
        withCredentials: true,
        onUploadProgress: (event) => {
          if (event.total) setProgress(Math.round((event.loaded * 100) / event.total));
        },
      })
      .then(() => {
        setStatus("success");
        toast.success("Assignment submitted", { description: `${selectedFile} is being analysed.` });
      })
      .catch((err) => {
        setStatus("idle");
        toast.error("Upload failed", { description: describeUploadError(err) });
      });
  };

  const steps = [
    { label: "Choose PDF", done: Boolean(file) },
    { label: "Add details", done: Boolean(file) && isValid && Boolean(desc.trim()) },
    { label: "Hand in", done: status === "success" },
  ];
  const currentStep = steps.findIndex((step) => !step.done);
  const uploading = status === "uploading";

  return (
    <PageTransition className="page">
      <PageHeader
        index="01"
        eyebrow="Student workspace"
        title="Hand in your"
        accent="assignment."
        subtitle="Upload a scanned PDF of your handwritten work. It's transcribed and checked automatically."
        actions={<Checklist steps={steps} current={currentStep} />}
      />

      <AnimatePresence mode="wait">
        {status === "success" ? (
          <Sheet
            key="success"
            taped
            className="upload-success"
            initial={{ opacity: 0, y: 40, rotate: -4 }}
            animate={{ opacity: 1, y: 0, rotate: -1 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ type: "spring", stiffness: 220, damping: 24 }}
          >
            <Stamp tone="blue" size="lg" rotate={-9} delay={0.35} className="upload-success__stamp">
              Received
            </Stamp>
            <h2>Handed in.</h2>
            <p>
              <strong>{selectedFile}</strong> is being transcribed and analysed. Your professor will see the results
              in their summary.
            </p>
            <button type="button" className="btn btn-lg" onClick={reset}>
              <RefreshCw size={16} />
              Submit another
            </button>
          </Sheet>
        ) : (
          <motion.form
            key="form"
            className="upload-grid"
            onSubmit={handleUpload}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <Sheet
              className="upload-card"
              initial={{ opacity: 0, y: 24, rotate: -1.5 }}
              animate={{ opacity: 1, y: 0, rotate: 0 }}
              transition={{ duration: 0.55, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className="sheet__header">
                <span className="sheet__title">Your paper</span>
                <span className="badge">.pdf</span>
              </div>
              <div className="sheet__body">
                <input ref={fileInputRef} id="file-input" type="file" accept=".pdf" onChange={handleFileChange} hidden />
                <motion.div
                  className={`dropzone ${dragActive ? "is-dragging" : ""} ${file ? "has-file" : ""} ${attempted && !file ? "is-missing" : ""}`}
                  role="button"
                  tabIndex={0}
                  aria-label="Choose a PDF to upload"
                  onClick={openFilePicker}
                  onKeyDown={(e) => {
                    if (e.target === e.currentTarget && (e.key === "Enter" || e.key === " ")) {
                      e.preventDefault();
                      openFilePicker();
                    }
                  }}
                  onDragEnter={handleDrag}
                  onDragOver={handleDrag}
                  onDragLeave={handleDrag}
                  onDrop={handleDrop}
                  animate={{ rotate: dragActive ? -0.8 : 0 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                >
                  <AnimatePresence mode="wait" initial={false}>
                    {file ? (
                      <motion.div
                        key="file"
                        className="file-slip"
                        initial={{ opacity: 0, y: -30, rotate: -6 }}
                        animate={{ opacity: 1, y: 0, rotate: -1.5 }}
                        exit={{ opacity: 0, y: 30, rotate: 4 }}
                        transition={{ type: "spring", stiffness: 280, damping: 20 }}
                      >
                        <span className="file-slip__thumb" aria-hidden="true">
                          <span>PDF</span>
                        </span>
                        <span className="file-slip__meta">
                          <strong title={file.name}>{file.name}</strong>
                          <span>{formatBytes(file.size)} · click to replace</span>
                        </span>
                        <button type="button" className="btn btn-ghost btn-icon" onClick={removeFile} aria-label="Remove file">
                          <Trash size={18} />
                        </button>
                      </motion.div>
                    ) : (
                      <motion.div
                        key="empty"
                        className="dropzone__empty"
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -12 }}
                      >
                        <PaperStack lifted={dragActive} />
                        <strong>{dragActive ? "Let go to drop it in." : "Drop your paper here"}</strong>
                        <span>
                          or <span className="dropzone__browse">browse your files</span>
                        </span>
                      </motion.div>
                    )}
                  </AnimatePresence>
                  {!file && (
                    <Annotation className="dropzone__note" arrow="left" rotate={-6} delay={0.9}>
                      scanned PDFs only!
                    </Annotation>
                  )}
                </motion.div>
              </div>
            </Sheet>

            <Sheet
              className="upload-card"
              initial={{ opacity: 0, y: 24, rotate: 1.5 }}
              animate={{ opacity: 1, y: 0, rotate: 0 }}
              transition={{ duration: 0.55, delay: 0.18, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className="sheet__header">
                <span className="sheet__title">Details</span>
              </div>
              <div className="sheet__body upload-details">
                <InputWithLabel
                  id="rename"
                  label="File name"
                  value={selectedFile}
                  onChange={(e) => {
                    setSelectedFile(e.target.value);
                    setIsValid(e.target.value.endsWith(".pdf"));
                  }}
                  onFocus={handleRenameInputFocus}
                  inputRef={renameInputRef}
                  disabled={!file || uploading}
                  error={!isValid ? "File name must end with '.pdf'" : undefined}
                  hint={!file ? "Choose a file first, then rename it here if you like." : undefined}
                />

                <div>
                  <label className="label" htmlFor="description">
                    Description
                  </label>
                  <textarea
                    id="description"
                    className={`textarea ${attempted && !desc.trim() ? "textarea--error" : ""}`}
                    placeholder="e.g. Physics assignment 3, questions 1–5"
                    value={desc}
                    maxLength={DESCRIPTION_LIMIT}
                    disabled={uploading}
                    onChange={(e) => setDesc(e.target.value)}
                  />
                  <div className="upload-details__counter">
                    {desc.length}/{DESCRIPTION_LIMIT}
                  </div>
                </div>

                <AnimatePresence>
                  {uploading && (
                    <motion.div
                      className="upload-progress"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                    >
                      <div className="upload-progress__row">
                        <span>Uploading…</span>
                        <span>{progress}%</span>
                      </div>
                      <div className="upload-progress__track">
                        <motion.div className="upload-progress__fill" animate={{ width: `${progress}%` }} />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <button type="submit" className="btn btn-primary btn-lg btn-block" disabled={uploading}>
                  {uploading ? <LoaderCircle size={18} className="spin" /> : <Send size={18} />}
                  {uploading ? "Handing in…" : "Hand in assignment"}
                </button>
              </div>
            </Sheet>
          </motion.form>
        )}
      </AnimatePresence>
    </PageTransition>
  );
};

export default Student;
