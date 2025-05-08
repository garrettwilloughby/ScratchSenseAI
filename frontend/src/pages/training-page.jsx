import { useState, useEffect, useRef } from "react";
import { analyzeVideo, plotTrajectories, createLabeledVideo, extractFrames, labelFrames, checkLabels, createTrainingDataset, trainNetwork } from "../utils/dlcUtils.jsx";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTrashCan } from "@fortawesome/free-solid-svg-icons";

import ScrubBar from "../components/scrubBar";
import ActionDropdown from "../components/actionDropdown";
import Tooltip from '../components/toolTip';

const TrainingPage = () => {
  const [videos, setVideos] = useState([]);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [flags, setFlags] = useState([]);
  const [classification, setClassification] = useState(null);
  const videoRef = useRef(null);
  
  // State for console logs
  const [consoleLogs, setConsoleLogs] = useState([]);
  const logContainerRef = useRef(null);

  // Toggle state for Dev/Prod mode
  const [isDevMode, setIsDevMode] = useState(false);
  
  // State for delete confirmation modal
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [videoToDelete, setVideoToDelete] = useState(null);
  const [passwordError, setPasswordError] = useState("");
  
  // This should be stored securely in a real application
  // For demo purposes, we're using a hardcoded password
  const CORRECT_PASSWORD = "admin123";

  const logMessage = (message) => {
    setConsoleLogs((prevLogs) => [...prevLogs, message]);
  };

  useEffect(() => {
    const fetchVideos = async () => {
      try {
        const response = await fetch("http://localhost:8080/get_videos");
        if (!response.ok) {
          throw new Error("Failed to fetch videos");
        }
        const data = await response.json();
        console.log("Data fetched in Training.jsx:", data);
        const videoList = data.videos.map((file, index) => ({
          id: file.video_id,
          name: file.name,
          path: file.path,
          original_filename: file.original_name,
          url: `http://localhost:8080/stream_video/${file.name}`,
        }));
        setVideos(videoList);

        if (videoList.length > 0) {
          setSelectedVideo(videoList[0]);
          logMessage(`Initially selected video: ${videoList[0].name} (${videoList[0].original_filename})`);
        }
      } catch (error) {
        console.error("Error fetching videos:", error);
        logMessage(`Error fetching videos: ${error.message}`);
      }
    };

    fetchVideos();
  }, []);

  const handleVideoSelect = (video) => {
    setSelectedVideo(video);
    setClassification(null);
  };

  useEffect(() => {
    if (videoRef.current && selectedVideo) {
      videoRef.current.src = selectedVideo.url;
      videoRef.current.load();
  
      //Ensure muted before autoplay attempt
      videoRef.current.muted = true;
  
      videoRef.current.oncanplay = () => {
        videoRef.current?.play().catch((error) => {
          console.warn("Autoplay prevented. Waiting for user interaction.", error);
        });
      };
    }
  }, [selectedVideo]);

  useEffect(() => {
    if (selectedVideo) {
      logMessage(`Selected Video: ${selectedVideo.name} (${selectedVideo.original_filename})`);
      console.log("Selected Video:", selectedVideo);
    }
  }, [selectedVideo]);

  // Function to initiate delete process - shows modal
  const initiateDelete = (video) => {
    setVideoToDelete(video);
    setDeletePassword("");
    setPasswordError("");
    setShowDeleteModal(true);
  };
  
  // Function to handle password submission
  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    
    if (deletePassword === CORRECT_PASSWORD) {
      // Password correct, proceed with deletion
      performDelete(videoToDelete.id);
      setShowDeleteModal(false);
    } else {
      // Password incorrect
      setPasswordError("Incorrect password. Please try again.");
    }
  };
  
  // Function to close modal
  const closeDeleteModal = () => {
    setShowDeleteModal(false);
    setVideoToDelete(null);
    setDeletePassword("");
    setPasswordError("");
  };

  // Function that actually performs the deletion
  const performDelete = async (videoId) => {
    try {
      console.log("Deleting video with ID:", videoId);
      const response = await fetch(`http://localhost:8080/delete_video/${videoId}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to delete video");
      }

      const data = await response.json();
      console.log(data.message);

      setVideos((prevVideos) => prevVideos.filter((video) => video.id !== videoId));

      if (selectedVideo?.id === videoId) {
        const remainingVideos = videos.filter(video => video.id !== videoId);
        if (remainingVideos.length > 0) {
          setSelectedVideo(remainingVideos[0]);
          logMessage(`Selected next available video: ${remainingVideos[0].name}`);
        } else {
          setSelectedVideo(null);
          logMessage("No videos remaining");
        }
      }

      logMessage(`Deleted Video: ${videoId}`);
    } catch (error) {
      console.error("Error deleting video:", error);
      logMessage(`Error deleting video: ${error.message}`);
    }
  };

  // Callback wrapper functions that check for selectedVideo, ensures no null errors
  const safeAnalyzeVideo = (path) => {
    if (!selectedVideo) {
      logMessage("Error: No video selected");
      return;
    }
    logMessage(`Analyzing video: ${selectedVideo.name} (${selectedVideo.original_filename})`);
    analyzeVideo(path);
  };

  const safePlotTrajectories = (path) => {
    if (!selectedVideo) {
      logMessage("Error: No video selected");
      return;
    }
    logMessage(`Plotting trajectories for: ${selectedVideo.name} (${selectedVideo.original_filename})`);
    plotTrajectories(path);
  };

  const safeCreateLabeledVideo = (path) => {
    if (!selectedVideo) {
      logMessage("Error: No video selected");
      return;
    }
    logMessage(`Creating labeled video for: ${selectedVideo.name} (${selectedVideo.original_filename})`);
    createLabeledVideo(path);
  };

  const safeExtractFrames = (path) => {
    if (!selectedVideo) {
      logMessage("Error: No video selected");
      return;
    }
    logMessage(`Extracting frames from: ${selectedVideo.name} (${selectedVideo.original_filename})`);
    extractFrames(path);
  };

  const safeLabelFrames = (path) => {
    if (!selectedVideo) {
      logMessage("Error: No video selected");
      return;
    }
    logMessage(`Labeling frames for: ${selectedVideo.name} (${selectedVideo.original_filename})`);
    labelFrames(path);
  };

  const safeCheckLabels = (path) => {
    if (!selectedVideo) {
      logMessage("Error: No video selected");
      return;
    }
    logMessage(`Checking labels for: ${selectedVideo.name} (${selectedVideo.original_filename})`);
    checkLabels(path);
  };

  const safeCreateTrainingDataset = () => {
    if (!selectedVideo) {
      logMessage("Error: No video selected");
      return;
    }
    logMessage(`Creating Training Dataset`);
    createTrainingDataset();
  };

  const safeTrainNetwork = () => {
    if (!selectedVideo) {
      logMessage("Error: No video selected");
      return;
    }
    logMessage(`Training Network`);
    trainNetwork();
  };

  // Effect to scroll console logs to bottom when new logs are added
  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [consoleLogs]);

  return (
    <div className="container mt-5 d-flex flex-column">
      {/* Toggle Switch */}
      <div className="d-flex mb-2">
        <label className="me-2 ms-1">Production</label>
        <div className="form-check form-switch">
          <input 
            className="form-check-input" 
            type="checkbox" 
            id="modeSwitch" 
            checked={isDevMode} 
            onChange={() => setIsDevMode(!isDevMode)} 
          />
          <label className="ms-1">Development</label>
        </div>
      </div>
      
      <div className="row">
        <div className="col-md-6">
          {/* Video List */}
          <div className="border rounded pb-2">
            <div className="d-flex align-items-center justify-content-between">
              <div className="d-flex align-items-center">
                <h5 className="mt-2 mb-2 mx-2 fw-bold">Videos</h5>
                <Tooltip 
                  className="" 
                  position="right"
                  text="
                  Videos uploaded will appear in this list. 
                  Select a video to see 'Flags' where the machine learning model marked scratching instances. 
                  By clicking on one of these flags, users can classify the flag as truePositive, falsePositive or trueNegative.
                  Flags can also be deleted.
                  Set range allows for users to specify new instances of scratching that may have not been recognized by the model.">
                </Tooltip>
              </div>
            </div>

            <ul
              className="list-group mx-2"
              style={{ 
                minHeight: "200px",
                maxHeight: isDevMode ? "200px" : undefined,
                height: isDevMode ? "" : "567px", 
                overflowY: "auto" }}
            >
              {videos.length > 0 ? (
                videos.map((video) => (
                  <li
                    key={video.id}
                    className={`list-group-item d-flex align-items-center justify-content-between ${
                      selectedVideo?.id === video.id ? "bg-mid-gray text-black" : ""
                    }`}
                    style={{ cursor: "pointer" }}
                    onClick={() => handleVideoSelect(video)}
                  >
                    {/* File name with flexible space */}
                    <span className="flex-grow-1 text-truncate px-2">{video.original_filename}</span>

                    {/* Delete button with spacing */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation(); // Prevents triggering video selection on button click
                        initiateDelete(video);
                      }}
                      className="btn btn-sm btn-outline-danger"
                    >
                      <FontAwesomeIcon icon={faTrashCan} />
                    </button>
                  </li>
                ))
              ) : (
                <li className="list-group-item text-center">No videos available</li>
              )}
            </ul>
          </div>

          {/* Console Logs - Hidden in Prod Mode */}
          {isDevMode && (
            <div className="mt-3 border rounded">
              <h5 className="mt-2 mx-2 fw-bold">Console Output</h5>
              <div
                ref={logContainerRef}
                className="mx-2 mb-2"
                style={{
                  height: "300px",
                  maxHeight: "300px",
                  overflowY: "auto",
                  border: "1px solid #ddd",
                  padding: "10px",
                  backgroundColor: "#f9f9f9",
                }}
              >
                {consoleLogs.length > 0 ? (
                  consoleLogs.map((log, index) => (
                    <p key={index} style={{ margin: "2px 0" }}>
                      {log}
                    </p>
                  ))
                ) : (
                  <p>No console output yet</p>
                )}
              </div>
            </div>
          )}

          <ActionDropdown
            selectedVideo={selectedVideo}
            analyzeVideo={safeAnalyzeVideo}
            plotTrajectories={safePlotTrajectories}
            createLabeledVideo={safeCreateLabeledVideo}
            extractFrames={safeExtractFrames}
            createTrainingDataset={safeCreateTrainingDataset}
            trainNetwork={safeTrainNetwork}
          />
        </div>

        {/* Video Player & Dropdown */}
        <div className="col-md-6 border rounded">
          {selectedVideo ? (
            <div>
              <video ref={videoRef} style={{ width: "100%" }} className="mt-1" controls>
                <source src={selectedVideo.url} type="video/mp4"/>
                Your browser does not support the video tag.
              </video>

              <ScrubBar videoRef={videoRef} flags={flags} setFlags={setFlags} selectedVideo={selectedVideo} />
            </div>
          ) : (
            <div className="text-center p-5">
              <p>Select a video to start playing or upload a new video.</p>
            </div>
          )}
        </div>
      </div>

      {/* Password Modal */}
      {showDeleteModal && (
        <div className="modal fade show" style={{ display: 'block', backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Confirm Video Deletion</h5>
                <button type="button" className="btn-close" onClick={closeDeleteModal}></button>
              </div>
              <form onSubmit={handlePasswordSubmit}>
                <div className="modal-body">
                  <p>You are about to delete: <strong>{videoToDelete?.original_filename}</strong></p>
                  <p>Please enter your password to confirm this action:</p>
                  <div className="mb-3">
                    <input
                      type="password"
                      className={`form-control ${passwordError ? 'is-invalid' : ''}`}
                      value={deletePassword}
                      onChange={(e) => setDeletePassword(e.target.value)}
                      placeholder="Enter password"
                      required
                    />
                    {passwordError && (
                      <div className="invalid-feedback">
                        {passwordError}
                      </div>
                    )}
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={closeDeleteModal}>Cancel</button>
                  <button type="submit" className="btn btn-danger">Delete</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default TrainingPage;