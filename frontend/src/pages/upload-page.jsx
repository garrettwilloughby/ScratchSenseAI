import React, { useState } from 'react';
import Tooltip from '../components/toolTip';
import 'bootstrap/dist/css/bootstrap.min.css';

const UploadPage = () => {
  const [video, setVideo] = useState(null);
  const [videoPreview, setVideoPreview] = useState('');
  const [message, setMessage] = useState('');
  const [showModal, setShowModal] = useState(false); // For modal visibility

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file && file.type.startsWith('video/')) {
      if (videoPreview) {
        URL.revokeObjectURL(videoPreview); // Revoke previous preview URL
      }
      setVideo(file);
      setVideoPreview(URL.createObjectURL(file));
      setMessage('');
    } else {
      if (videoPreview) {
        URL.revokeObjectURL(videoPreview);
      }
      setMessage('Please select a valid video file.');
      setVideo(null);
      setVideoPreview('');
      setShowModal(true); // Show the modal for the message
    }
  };

  const handleUpload = async () => {
    if (!video) {
      setMessage('No video selected for upload.');
      setShowModal(true); // Show the modal for the message
      return;
    }
  
    const formData = new FormData();
    formData.append('video', video);
  
    try {  
      const response = await fetch('http://localhost:8080/upload', {
        method: 'POST',
        body: formData,
      });
  
      if (response.ok) {
        setMessage('Video uploaded successfully!');
      } else {
        setMessage('Failed to upload video.');
      }
    } catch (error) {
      setMessage('Error: ' + error.message);
    }
    setShowModal(true); // Show the modal for the message
  };

  const closeModal = () => setShowModal(false);

  return (
    <div className="container mt-5">
      <div className="card p-4">
        <div className="mb-3">
          <input
            type="file"
            accept="video/*"
            className="form-control"
            onChange={handleFileChange}
          />
        </div>

        {video && (
          <div className="mb-3">
            <small className="text-muted">File Path: {video.name}</small>
          </div>
        )}

        {videoPreview ? (
          <div className="mt-1 text-center">
            <h5 className='fw-semibold'>Video Preview</h5>
            <video
              width="100%"
              style={{ maxHeight: '450px', objectFit: 'contain' }}
              controls
            >
              <source src={videoPreview} type={video?.type} />
              Your browser does not support the video tag.
            </video>
          </div>
        ) : (
          <div
            className="mt-1 d-flex justify-content-center align-items-center border"
            style={{
              height: '60vh',
              borderRadius: '10px',
              backgroundColor: '#f8f9fa',
            }}
          >
            <p className="text-muted">No video selected</p>
          </div>
        )}

        <div
          className="d-flex justify-content-center pt-3"
          style={{ borderRadius: '25px' }}
        >
          <button
            className="dft-btn"
            onClick={handleUpload}
            disabled={!video}
          >
            Upload
          </button>
        </div>
        
      </div>

      {/* Bootstrap Modal */}
      {showModal && (
        <div
          className="modal show d-block"
          tabIndex="-1"
          role="dialog"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
        >
          <div className="modal-dialog" role="document">
            <div className="modal-content">
            <div className="modal-header d-flex justify-content-between align-items-center">
                <h5 className="modal-title fw-bold">Notification</h5>
                <button
                  type="button"
                  className="close btn border hover:btn-secondary"
                  onClick={closeModal}
                  aria-label="Close"
                >
                  <span aria-hidden="true">&times;</span>
                </button>
              </div>
              <div className="modal-body">
                <p>{message}</p>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn border"
                  onClick={closeModal}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UploadPage;
