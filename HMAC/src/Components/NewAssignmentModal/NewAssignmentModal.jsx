import { useState } from "react";
import axios from "axios";
import { LoaderCircle, Plus } from "lucide-react";
import { toast } from "sonner";

import Modal from "../Modal/Modal";
import InputWithLabel from "../InputWithLabel/InputWithLabel";
import { API_BASE, authHeaders } from "../../utils/api";
import "./NewAssignmentModal.css";

// Professors create an assignment and paste the question paper / model answer,
// whose wording duplicate detection then ignores.
const NewAssignmentModal = ({ open, onClose, onCreated }) => {
  const [title, setTitle] = useState("");
  const [referenceText, setReferenceText] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) {
      setError("Give the assignment a title.");
      return;
    }
    setSaving(true);
    try {
      const response = await axios.post(
        `${API_BASE}/assignments/`,
        { title: title.trim(), reference_text: referenceText },
        { headers: authHeaders() }
      );
      toast.success("Assignment created", { description: response.data.title });
      setTitle("");
      setReferenceText("");
      setError("");
      onCreated(response.data);
    } catch (err) {
      toast.error("Couldn't create the assignment", {
        description: err.response ? "Only professors can create assignments." : "Couldn't reach the server.",
      });
    }
    setSaving(false);
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      labelledBy="new-assignment-title"
      eyebrow={
        <>
          <span className="eyebrow__index">+</span>
          Professor workspace
        </>
      }
      title="New assignment"
    >
      <form className="new-assignment" onSubmit={handleSubmit}>
        <InputWithLabel
          id="assignment-title"
          label="Title"
          value={title}
          onChange={(e) => {
            setTitle(e.target.value);
            if (error) setError("");
          }}
          error={error}
          required
        />
        <div>
          <label className="label" htmlFor="assignment-reference">
            Question paper or model answer (optional)
          </label>
          <textarea
            id="assignment-reference"
            className="textarea"
            placeholder="Paste the questions and any textbook definitions students are expected to reproduce."
            value={referenceText}
            onChange={(e) => setReferenceText(e.target.value)}
          />
          <p className="new-assignment__hint">
            Phrases from this text won&apos;t count as copying, so students restating the question aren&apos;t flagged.
          </p>
        </div>
        <button type="submit" className="btn btn-primary btn-lg" disabled={saving}>
          {saving ? <LoaderCircle size={18} className="spin" /> : <Plus size={18} />}
          Create assignment
        </button>
      </form>
    </Modal>
  );
};

export default NewAssignmentModal;
