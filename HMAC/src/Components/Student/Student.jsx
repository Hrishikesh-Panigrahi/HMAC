import React, { useState, useRef } from "react";
import Navbar from "../Navbar/Navbar";
import "./Student.css";
import PDF from "../../assets/PDF.png";
import axios from 'axios';

const Student = () => {
  const [selectedFile, setSelectedFile] = useState("");
  const [desc, setDesc] = useState("");
  const renameInputRef = useRef(null);
  const [isValid, setIsValid] = useState(true);
  const [file, setFile] = useState(null);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
    const file = e.target.files[0];
    setSelectedFile(file.name);
  };

  const handleRenameInputFocus = () => {
    const inputElement = renameInputRef.current;
    const indexOfExtension = selectedFile.lastIndexOf(".pdf");
    
    if (indexOfExtension > 0) {
      inputElement.setSelectionRange(0, indexOfExtension);
    }
  };

  const handleUpload = (e) => {
    e.preventDefault();

    const formData = new FormData();
    formData.append('selectedFile', selectedFile);
    formData.append('desc', desc);
    formData.append('file', file);

    axios.post('http://localhost:8000/api/v1/Upload/', formData, { withCredentials: true })
    .then(() => {
        console.log('File uploaded successfully');
    })
    .catch(err => {
        console.log(err);
    });
  };

  return (
    <>
      <Navbar goTo={'Professor'} toggleSummary={"false"}/>
      <div className="container">
        <div className="file-upload">
          <label htmlFor="file-input" className="custom-file-upload">
            <img src={PDF} alt="Upload Icon" />
            Upload File
          </label>
          <input
            id="file-input"
            type="file"
            accept=".pdf"
            onChange={handleFileChange}
          />
            <button onClick={handleUpload} type="submit" className="submit-button">
                <span>Submit</span>
            </button>
        </div>
        <div className="metaData">
          <label htmlFor="rename">Rename</label>
            <input
              type="text"
              id="rename"
              value={selectedFile}
              onChange={(e) => 
                {setSelectedFile(e.target.value);
                  setIsValid(e.target.value.endsWith(".pdf"));}}
              onFocus={handleRenameInputFocus} 
              ref={renameInputRef} 
              className={!isValid ? "invalid-input" : ""}
            />
          {!isValid && (
            <div className="error-message">File name must end with '.pdf'</div>
          )}
          <label htmlFor="description">Description</label>
          <textarea
            id="description"
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
          />
          <label htmlFor="pdf-name" id="pdf-name">PDF Name</label>
          <input value={selectedFile} disabled/>
        </div>
      </div>
    </>
  );
};

export default Student;