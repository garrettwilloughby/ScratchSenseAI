import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBackward, faForward, faPlay, faPause, faFlag, faTimes } from "@fortawesome/free-solid-svg-icons";

const ScrubBar = ({ videoRef, flags, setFlags, selectedVideo }) => {
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [selectedFlag, setSelectedFlag] = useState(null); // Track selected flag
  const [classification, setClassification] = useState(null); // Track classification
  const [currentFlagDuration, setCurrentFlagDuration] = useState(null); //Track flag duration
  
  // States for range selection
  const [isSettingRange, setIsSettingRange] = useState(false);
  const [rangeStart, setRangeStart] = useState(null);
  const [rangeEnd, setRangeEnd] = useState(null);
  const [isDraggingStart, setIsDraggingStart] = useState(false);
  const [isDraggingEnd, setIsDraggingEnd] = useState(false);
  
  // States for visibility toggles
  const [showModelFlags, setShowModelFlags] = useState(true);
  const [showUserFlags, setShowUserFlags] = useState(true);

  // Filter flags by source
  const modelFlags = flags.filter(flag => flag.source === "Model");
  const userFlags = flags.filter(flag => flag.source === "Flag");

  // Get visible flags based on toggle states
  const getVisibleFlags = () => {
    let visibleFlags = [];
    
    if (showModelFlags) visibleFlags = [...visibleFlags, ...modelFlags];
    if (showUserFlags) visibleFlags = [...visibleFlags, ...userFlags];
    
    return visibleFlags;
  };

  // Get color for a flag based on its source
  const getFlagColor = (flag) => {
    switch(flag.source) {
      case "Model": return "red";
      case "Flag": return "green";
      default: return "gray";
    }
  };

  //Format time into minuites:seconds in video
  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${minutes}:${secs < 10 ? "0" : ""}${secs}`;
  };

  useEffect(() => {
    if (!videoRef.current) return;

    const updateTime = () => {
      if (!videoRef.current) return;
      setCurrentTime(videoRef.current.currentTime);
      setDuration(videoRef.current.duration || 0);
    };

    videoRef.current.addEventListener("timeupdate", updateTime);
    videoRef.current.addEventListener("loadedmetadata", updateTime);

    return () => {
      if (videoRef.current) {
        videoRef.current.removeEventListener("timeupdate", updateTime);
        videoRef.current.removeEventListener("loadedmetadata", updateTime);
      }
    };
  }, [videoRef.current]);

  //Get flags upon restart based on the selected video.
  useEffect(() => {
    if (!selectedVideo) return;

    const fetchFlags = async () => {
      try {
        const response = await fetch(`http://localhost:8080/get_result/${selectedVideo.id}`);
        const data = await response.json();
        setFlags(data);
      } catch (error) {
        console.error("Error fetching flags:", error);
      }
    };

    fetchFlags();
  }, [selectedVideo]);

  const handleScrub = (event) => {
    if (!videoRef.current) return;
    const newTime = event.target.value;
    videoRef.current.currentTime = newTime;
    setCurrentTime(newTime);
    
    // Update range end if currently setting a range
    if (isSettingRange && rangeStart !== null && !isDraggingStart) {
      setRangeEnd(parseFloat(newTime));
    }
  };

  const toggleRangeSelection = () => {
    if (isSettingRange) {
      // Cancel range setting
      setIsSettingRange(false);
      setRangeStart(null);
      setRangeEnd(null);
    } else {
      // Start range setting
      setIsSettingRange(true);
      setRangeStart(currentTime);
      setRangeEnd(currentTime);
      // Pause video when starting to set range
      if (videoRef.current && isPlaying) {
        videoRef.current.pause();
        setIsPlaying(false);
      }
    }
  };

  const handleFlagSet = async () => {
    if (!videoRef.current || !isSettingRange || rangeStart === null || rangeEnd === null) return;

    // Ensure start is always less than end
    const start = Math.min(rangeStart, rangeEnd);
    const end = Math.max(rangeStart, rangeEnd);
    const flagDuration = end - start;

    const newFlag = {
      video_id: selectedVideo.id,
      time: start, // Use start time as the flag position
      classification: "truePositive", // Default classification
      duration: flagDuration, // Store the duration
      sequence: 0
    };

    try {
      console.log(newFlag);
      const response = await fetch("http://localhost:8080/set_flag", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          video_id: newFlag.video_id, 
          time: newFlag.time,
          duration: newFlag.duration,
          classification: newFlag.classification,
          sequence: newFlag.sequence,
          source: "Flag"
        }),
      });

      if (response.ok) {
        // Fetch updated flags to get correct IDs
        const updatedFlagsResponse = await fetch(`http://localhost:8080/get_result/${selectedVideo.id}`);
        const updatedFlags = await updatedFlagsResponse.json();
        setFlags(updatedFlags);
        
        // Reset range selection
        setIsSettingRange(false);
        setRangeStart(null);
        setRangeEnd(null);
      }
    } catch (error) {
      console.error("Error setting flag:", error);
    }
  };

  const handlePlayPause = async () => {
    if (!videoRef.current) return;
  
    try {
      if (videoRef.current.readyState >= 2) {
        if (isPlaying) {
          videoRef.current.pause();
          setIsPlaying(false);
        } else {
          await videoRef.current.play();
          setIsPlaying(true);
        }
      } else {
        // Wait for metadata to load before attempting play
        const onLoadedMetadata = async () => {
          videoRef.current.removeEventListener('loadedmetadata', onLoadedMetadata);
          await videoRef.current.play();
          setIsPlaying(true);
        };
        videoRef.current.addEventListener('loadedmetadata', onLoadedMetadata);
        videoRef.current.load();
      }
    } catch (error) {
      console.error("Play failed:", error);
    }
  };

  const handleFlagClick = (flag) => {
    console.log(flag);
    if (!videoRef.current) return;
    videoRef.current.currentTime = flag.time;
    setCurrentTime(flag.time);
    setSelectedFlag(flag);
    setClassification(flag.classification || null);
    setCurrentFlagDuration(flag.duration || null); // Still set for other uses
    
    // Exit range selection mode if active
    if (isSettingRange) {
      setIsSettingRange(false);
      setRangeStart(null);
      setRangeEnd(null);
    }
  };

  // New function to navigate to previous flag
  const goToPreviousFlag = () => {
    if (!videoRef.current) return;
    
    const visibleFlags = getVisibleFlags();
    if (visibleFlags.length === 0) return;
    
    // Sort flags by time
    const sortedFlags = [...visibleFlags].sort((a, b) => a.time - b.time);
    
    // Find the flag that comes before current time
    const previousFlags = sortedFlags.filter(flag => flag.time < currentTime);
    
    if (previousFlags.length > 0) {
      // Go to the closest previous flag
      const previousFlag = previousFlags[previousFlags.length - 1];
      handleFlagClick(previousFlag);
    } else {
      // If no previous flag, loop to the last flag in the video
      handleFlagClick(sortedFlags[sortedFlags.length - 1]);
    }
  };
  
  // New function to navigate to next flag
  const goToNextFlag = () => {
    if (!videoRef.current) return;
    
    const visibleFlags = getVisibleFlags();
    if (visibleFlags.length === 0) return;
    
    // Sort flags by time
    const sortedFlags = [...visibleFlags].sort((a, b) => a.time - b.time);
    
    // Find the flag that comes after current time
    const nextFlags = sortedFlags.filter(flag => flag.time > currentTime);
    
    if (nextFlags.length > 0) {
      // Go to the closest next flag
      const nextFlag = nextFlags[0];
      handleFlagClick(nextFlag);
    } else {
      // If no next flag, loop to the first flag in the video
      handleFlagClick(sortedFlags[0]);
    }
  };

  const deselectFlag = () => {
    setSelectedFlag(null);
    setClassification(null);
    setCurrentFlagDuration(null);
  };

  const handleClassify = async (classification) => {
    if (!selectedFlag) return;  // Ensure a flag is selected

    try {
      const response = await fetch(`http://localhost:8080/update_flag/${selectedFlag.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ classification }),
      });

      if (response.ok) {
        setFlags((prevFlags) =>
          prevFlags.map((flag) =>
            flag.id === selectedFlag.id ? { ...flag, classification } : flag
          )
        );
      }
    } catch (error) {
      console.error("Error updating flag classification:", error);
    }
  };

  // Handle flag deletion
  const handleDeleteFlag = async () => {
    if (!selectedFlag) return;  // Ensure a flag is selected

    try {
      const response = await fetch(`http://localhost:8080/delete_flag/${selectedFlag.id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        // Remove deleted flag from local state
        setFlags((prevFlags) => prevFlags.filter((flag) => flag.id !== selectedFlag.id));
        setSelectedFlag(null); // Deselect the flag after deletion
      }
    } catch (error) {
      console.error("Error deleting flag:", error);
    }
  };

  // Calculate precise position based on mouse position relative to scrub bar
  const calculatePosition = (e, scrubContainer) => {
    const rect = scrubContainer.getBoundingClientRect();
    const offsetX = e.clientX - rect.left;
    const percentage = offsetX / rect.width;
    return Math.max(0, Math.min(percentage * duration, duration));
  };

  // Handle start marker drag
  const handleStartMarkerDrag = (e) => {
    if (!isDraggingStart) return;
    const newTime = calculatePosition(e, e.currentTarget);
    setRangeStart(newTime);
    if (videoRef.current) {
      videoRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  // Handle end marker drag
  const handleEndMarkerDrag = (e) => {
    if (!isDraggingEnd) return;
    const newTime = calculatePosition(e, e.currentTarget);
    setRangeEnd(newTime);
    if (videoRef.current) {
      videoRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  // Add mouse up event listener to document
  useEffect(() => {
    const handleMouseUp = () => {
      setIsDraggingStart(false);
      setIsDraggingEnd(false);
    };
    
    document.addEventListener('mouseup', handleMouseUp);
    
    return () => {
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  return (
    <div style={{ position: "relative", width: "100%", textAlign: "center" }}>
      {/* Video Time Display and Flag Visibility Controls */}
      <div className="d-flex justify-content-between align-items-center mb-2">
        {/* Left side - Time display and range info */}
        <div className="d-flex align-items-center">
          <strong className="me-2" style={{ minWidth: '120px' }}>
            {formatTime(currentTime)} / {formatTime(duration)}
          </strong>

          {isSettingRange && rangeStart !== null && rangeEnd !== null && (
            <span className="badge text-black fw-normal ms-2" style={{ whiteSpace: 'nowrap' }}>
              Range: {formatTime(Math.min(rangeStart, rangeEnd))} - {formatTime(Math.max(rangeStart, rangeEnd))} 
              (Duration: {formatTime(Math.abs(rangeEnd - rangeStart))})
            </span>
          )}
        </div>
        
        {/* Right side - Flag visibility toggles */}
        <div className="d-flex align-items-center">
          <div className="form-check form-check-inline m-0 me-1">
            <input
              className="form-check-input form-check-input-sm"
              type="checkbox"
              id="showModelFlags"
              checked={showModelFlags}
              onChange={() => setShowModelFlags(!showModelFlags)}
            />
            <label className="form-check-label text-muted" style={{fontSize: "0.75rem"}} htmlFor="showModelFlags">
              Model
            </label>
          </div>
          
          <div className="form-check form-check-inline m-0 me-1">
            <input
              className="form-check-input form-check-input-sm"
              type="checkbox"
              id="showUserFlags"
              checked={showUserFlags}
              onChange={() => setShowUserFlags(!showUserFlags)}
            />
            <label className="form-check-label text-muted" style={{fontSize: "0.75rem"}} htmlFor="showUserFlags">
              User
            </label>
          </div>
        </div>
      </div>

      {/* Video Scrub Bar - Completely separated from flag functionality */}
      <div 
        className="scrub-bar-container"
        style={{ 
          position: "relative", 
          width: "100%",
          height: "20px",
          marginBottom: "16px"
        }}
      >
        {/* Custom styled range input */}
        <input
          type="range"
          min="0"
          max={duration}
          step="0.1"
          value={currentTime}
          onChange={handleScrub}
          className="custom-scrubber"
          style={{
            width: "100%",
            position: "absolute",
            zIndex: "3",
            top: "0",
            left: "0",
            height: "20px",
            margin: "0",
            appearance: "none",
            backgroundColor: "transparent",
            cursor: "pointer"
          }}
        />

        {/* Track background */}
        <div
          style={{
            position: "absolute",
            top: "8px",
            left: "0",
            right: "0",
            height: "4px",
            backgroundColor: "#ccc",
            borderRadius: "2px",
            zIndex: "1"
          }}
        />

        {/* Progress fill */}
        <div
          style={{
            position: "absolute",
            top: "8px",
            left: "0",
            width: `${(currentTime / duration) * 100}%`,
            height: "4px",
            backgroundColor: "#007bff",
            borderRadius: "2px",
            zIndex: "1"
          }}
        />

        {/* Pointer/scrubber indicator */}
        <div
          style={{
            position: "absolute",
            left: `${(currentTime / duration) * 100}%`,
            top: "0",
            width: "0",
            height: "0",
            borderLeft: "5px solid transparent",
            borderRight: "5px solid transparent",
            borderTop: "8px solid #007bff",
            transform: "translateX(-5px)",
            zIndex: "3"
          }}
        />
      </div>

      {/* Separate Flag Bar - Completely independent from scrub functionality */}
      <div 
        className="flag-bar-container"
        style={{ 
          position: "relative", 
          width: "100%",
          height: "25px",
          backgroundColor: "#f0f0f0",
          borderRadius: "3px",
          marginBottom: "12px"
        }}
        onMouseMove={(e) => {
          if (isDraggingStart) handleStartMarkerDrag(e);
          if (isDraggingEnd) handleEndMarkerDrag(e);
        }}
      >
        {/* Current Time Marker in Flag Bar */}
        <div
          style={{
            position: "absolute",
            left: `${(currentTime / duration) * 100}%`,
            top: "0",
            height: "100%",
            width: "1px",
            backgroundColor: "#333",
            zIndex: "3"
          }}
        />

        {/* All Flags */}
        {getVisibleFlags().map((flag, index) => {
          const startPercentage = duration !== 0 ? (flag.time / duration) * 100 : 0;
          
          // Use the flag's own duration property
          const flagDuration = (flag.duration !== null && flag.duration !== undefined && flag.duration > 0) 
            ? flag.duration 
            : 0;
            
          const width = flagDuration > 0 
            ? `${((flagDuration / duration) * 100)}%` 
            : "4px";
          
          // Only apply transform for point flags (no duration)
          const transform = flagDuration > 0 ? "none" : "translateX(-50%)";
          
          // Get flag color based on source
          const color = getFlagColor(flag);
          
          return (
            <div key={index}>
              {/* Clickable Flag */}
              <div
                title={`${flag.source} flag at ${formatTime(flag.time)}${flagDuration > 0 ? ` - ${formatTime(flag.time + flagDuration)}` : ''}`}
                onClick={() => handleFlagClick(flag)}
                style={{
                  position: "absolute",
                  left: `${startPercentage}%`,
                  width: width,
                  height: "100%",
                  backgroundColor: color,
                  cursor: "pointer",
                  transform: transform,
                  opacity: 0.7,
                  zIndex: "2",
                  outline: selectedFlag && selectedFlag.id === flag.id ? "2px solid yellow" : "none"
                }}
              />
            </div>
          );
        })}

        {/* Range Selection Overlay */}
        {isSettingRange && rangeStart !== null && rangeEnd !== null && (
          <div style={{ 
            position: "absolute", 
            top: "0", 
            left: `${(Math.min(rangeStart, rangeEnd) / duration) * 100}%`, 
            width: `${(Math.abs(rangeEnd - rangeStart) / duration) * 100}%`,
            height: "100%",
            backgroundColor: "rgba(0, 123, 255, 0.4)",
            border: "1px dashed #007bff",
            zIndex: "1",
            pointerEvents: "none",
          }} />
        )}

        {/* Range Start Marker */}
        {isSettingRange && rangeStart !== null && (
          <div 
            style={{
              position: "absolute",
              left: `${(rangeStart / duration) * 100}%`,
              top: "0",
              height: "100%",
              width: "4px",
              backgroundColor: "#007bff",
              cursor: "ew-resize",
              zIndex: "4"
            }}
            onMouseDown={() => setIsDraggingStart(true)}
            title={`Start: ${formatTime(rangeStart)}`}
          />
        )}

        {/* Range End Marker */}
        {isSettingRange && rangeEnd !== null && (
          <div 
            style={{
              position: "absolute",
              left: `${(rangeEnd / duration) * 100}%`,
              top: "0",
              height: "100%",
              width: "4px",
              backgroundColor: "#dc3545",
              cursor: "ew-resize",
              zIndex: "4"
            }}
            onMouseDown={() => setIsDraggingEnd(true)}
            title={`End: ${formatTime(rangeEnd)}`}
          />
        )}
      </div>

      {/* Flag Legend */}
      <div className="d-flex justify-content-center gap-3 mb-2">
        <span className="text-muted small">
          <span style={{ display: "inline-block", width: "12px", height: "12px", backgroundColor: "red", marginRight: "4px" }}></span>
          Model
        </span>
        <span className="text-muted small">
          <span style={{ display: "inline-block", width: "12px", height: "12px", backgroundColor: "green", marginRight: "4px" }}></span>
          User
        </span>
      </div>

      {/* Control Buttons - all in one line */}
      <div className="d-flex justify-content-between align-items-center mb-3">
        {/* Left side - Playback controls */}
        <div className="d-flex gap-2">
          <button onClick={goToPreviousFlag} className="btn border" title="Go to previous flag">
            <FontAwesomeIcon icon={faBackward} />
          </button>
          <button onClick={handlePlayPause} className="btn border">
            {isPlaying ? <FontAwesomeIcon icon={faPause} /> : <FontAwesomeIcon icon={faPlay} />}
          </button>
          <button onClick={goToNextFlag} className="btn border" title="Go to next flag">
            <FontAwesomeIcon icon={faForward} />
          </button>
          
          {isSettingRange ? (
            <>
              <button 
                onClick={handleFlagSet} 
                className="btn btn-success border"
                disabled={rangeStart === null || rangeEnd === null}
              >
                <FontAwesomeIcon icon={faFlag} /> Set Flag
              </button>
              <button onClick={toggleRangeSelection} className="btn btn-danger border">
                Cancel
              </button>
            </>
          ) : (
            <button onClick={toggleRangeSelection} className="btn border">
              <FontAwesomeIcon icon={faFlag} /> Set Range
            </button>
          )}
        </div>
        
        {/* Right side - Classification buttons (only shown when flag is selected) */}
        {selectedFlag ? (
          <div className="d-flex gap-1">
            <button
              className={`btn btn-sm ${classification === "truePositive" ? "btn-success" : "btn border"}`}
              style={{ fontSize: '0.75rem', maxWidth: "60px", maxHeight: "40px", padding: "0px", fontWeight: "500"}}
              onClick={() => {
                handleClassify("truePositive"); 
                setClassification("truePositive");
              }}
            >
              True Positive
            </button>
            <button
              className={`btn btn-sm ${classification === "trueNegative" ? "btn-info" : "btn border"}`}
              style={{ fontSize: '0.75rem', maxWidth: "65px", maxHeight: "40px", padding: "0px"}}
              onClick={() => {
                handleClassify("trueNegative"); 
                setClassification("trueNegative");
              }}
            >
              True Negative
            </button>
            <button
              className={`btn btn-sm ${classification === "falsePositive" ? "btn-warning" : "btn border"}`}
              style={{ fontSize: '0.75rem', maxWidth: "60px", maxHeight: "40px", padding: "0px"}}
              onClick={() => {
                handleClassify("falsePositive"); 
                setClassification("falsePositive");
              }}
            >
              False Positive
            </button>
            <button onClick={handleDeleteFlag} 
              style={{ fontSize: '0.75rem', maxWidth: "50px", maxHeight: "40px", padding: "0px"}}
              className="btn btn-sm btn-danger">
              Delete Flag
            </button>
            <button onClick={deselectFlag} className="btn btn-sm btn-secondary" title="Deselect flag">
              <FontAwesomeIcon icon={faTimes} />
            </button>
          </div>
        ) : (
          <div></div> // Empty div to maintain flex layout when no flag is selected
        )}
      </div>

      {/* CSS for styling */}
      <style jsx>{`
        .custom-scrubber::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 1px;
          height: 20px;
          background: transparent;
          cursor: pointer;
        }
        
        .custom-scrubber::-moz-range-thumb {
          width: 1px;
          height: 20px;
          background: transparent;
          cursor: pointer;
          border: none;
        }
      `}</style>
    </div>
  );
};

export default ScrubBar;