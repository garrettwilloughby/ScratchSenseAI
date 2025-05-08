import React, { useState, useEffect } from "react";
import { FaChevronDown, FaChevronUp } from "react-icons/fa";

const ActionDropdown = ({ selectedVideo, analyzeVideo, plotTrajectories, createLabeledVideo, extractFrames, createTrainingDataset, trainNetwork}) => {
    // Only create actions when selectedVideo is available
    const getActions = () => [
        { label: "Create Training Dataset", func: () => selectedVideo ? createTrainingDataset() : null },
        { label: "Train Network", func: () => selectedVideo ? trainNetwork() : null },
        { label: "Analyze Video", func: () => selectedVideo ? analyzeVideo(selectedVideo.path) : null },
        { label: "Plot Trajectories", func: () => selectedVideo ? plotTrajectories(selectedVideo.path) : null },
        { label: "Create Labeled Video", func: () => selectedVideo ? createLabeledVideo(selectedVideo.path) : null },
        { label: "Extract Frames", func: () => selectedVideo ? extractFrames(selectedVideo.path) : null }
        
       
        
        // { label: "Label Frames", func: () => selectedVideo ? labelFrames(selectedVideo.path) : null },
        // { label: "Check Labels", func: () => selectedVideo ? checkLabels(selectedVideo.path) : null },
    ];

    const [selectedAction, setSelectedAction] = useState("Analyze Video");
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    
    // Get current action function based on selected label
    const getCurrentActionFunction = () => {
        const actions = getActions();
        const action = actions.find(a => a.label === selectedAction);
        return action ? action.func : () => {};
    };

    // Log for debugging
    useEffect(() => {
        console.log("ActionDropdown received new selectedVideo:", selectedVideo);
    }, [selectedVideo]);

    return (
        <div className="btn-group w-50 mt-3">
        <button 
          className="dft-btn rounded-end-0" 
          style={{ minWidth: "200px" }}
          onClick={getCurrentActionFunction()} 
          disabled={!selectedVideo}
        >
          {selectedVideo ? selectedAction : "Select a video first"}
        </button>
      
        <button 
          className="dft-btn dropdown-toggle-split w-25 rounded-start-0" 
          type="button" 
          data-bs-toggle="dropdown" 
          aria-expanded={isDropdownOpen}
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          disabled={!selectedVideo}
        >
          {isDropdownOpen ? <FaChevronUp /> : <FaChevronDown />}
        </button>
      
        <ul className={`dropdown-menu ${isDropdownOpen ? "show" : ""}`}>
          {getActions().map((action, index) => (
            <li key={index}>
              <button
                className="dropdown-item"
                onClick={() => {
                  setSelectedAction(action.label);
                  setIsDropdownOpen(false);
                }}
              >
                {action.label}
              </button>
            </li>
          ))}
        </ul>
      </div>
      
    );
};

export default ActionDropdown;