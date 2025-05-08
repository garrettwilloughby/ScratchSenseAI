import React, { useState } from "react";

const SettingsPage = () => {
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [password, setPassword] = useState("");
  const [actionToExecute, setActionToExecute] = useState(null);
  const [error, setError] = useState("");

  const correctPassword = "admin123";

  const handlePasswordSubmit = () => {
    if (password === correctPassword) {
      // Execute the stored action
      if (actionToExecute) {
        actionToExecute();
      }
      // Reset state
      setShowPasswordModal(false);
      setPassword("");
      setError("");
    } else {
      setError("Incorrect password");
    }
  };

  // Requires password, displays modal upon clicking
  const requirePassword = (action) => {
    return () => {
      setActionToExecute(() => action);
      setShowPasswordModal(true);
      setError("");
    };
  };

  const handleClearDatabase = async () => {
    try {
      const response = await fetch('http://127.0.0.1:8080/clear_database',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
      if (response.ok) {
        console.log("Database cleared");
        alert("Database cleared successfully");
      } else {
        console.error("Failed to clear database");
        alert("Failed to clear database");
      }
    }
    catch(error) {
      console.log("Error calling clear database API:", error);
      alert("Error: " + error.message);
    }
  };

  const handleRefreshVideos = async () => {
    console.log("Refreshing videos...");
    
    try {
      const response = await fetch('http://127.0.0.1:8080/process_results', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      const data = await response.json();
      
      if (response.ok) {
        console.log("Videos refreshed!", data.added_videos);
        alert("Videos refreshed successfully!");
      } else {
        console.error("Failed to refresh videos:", data.message);
        alert("Failed to refresh videos: " + data.message);
      }
    } catch (error) {
      console.error("Error calling refresh-videos API:", error);
      alert("Error: " + error.message);
    }
  };

  const handleRefreshData = async () => {
    try {
      const response = await fetch('http://localhost:8080/process_results', {
        method: 'POST',
      });
            
      if (response.ok) {
        console.log("Data refreshed!");
        alert("Data refreshed successfully!");
      } else {
        console.log("Failed to process data.");
        alert("Failed to process data");
      }
    } catch (error) {
      console.log("Error in settings refresh data:", error);
      alert("Error: " + error.message);
    }
  };

  return (
    <div className="d-flex justify-content-center align-items-start vh-100 pt-5">
      <div className="card borderw" style={{ minWidth: "800px" }}>
        <div className="d-flex justify-content-left mt-3 mx-3">
          <h3 className="fw-bold">Settings</h3>
        </div>
        <div className="card-body w-100">
          <div className="list-group">
            <a 
              href="https://github.com/garrettwilloughby/Senior-Design.git" 
              className="list-group-item list-group-item-action"
              target="_blank" 
              rel="noopener noreferrer"
            >
              Link to GitHub
            </a>
            <button 
              className="list-group-item list-group-item-action text-danger" 
              onClick={requirePassword(handleClearDatabase)}
            >
              Clear Database
            </button>
            <button 
              className="list-group-item list-group-item-action" 
              onClick={requirePassword(handleRefreshVideos)}
            >
              Refresh Videos
            </button>
            <button 
              className="list-group-item list-group-item-action" 
              onClick={requirePassword(handleRefreshData)}
            >
              Refresh Data
            </button>
          </div>
        </div>
      </div>
  
      {/* Password Modal */}
      {showPasswordModal && (
        <div className="modal d-block" tabIndex="-1" role="dialog" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered" role="document">
            <div className="modal-content">
              <div className="modal-header bg-light">
                <h5 className="modal-title">Enter Password</h5>
                <button type="button" className="btn-close" onClick={() => setShowPasswordModal(false)}></button>
              </div>
              <div className="modal-body">
                {error && <div className="alert alert-danger">{error}</div>}
                <div className="mb-3">
                  <label htmlFor="password" className="form-label">Password</label>
                  <input 
                    type="password" 
                    className="form-control" 
                    id="password" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handlePasswordSubmit()}
                    autoFocus
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowPasswordModal(false)}>Cancel</button>
                <button type="button" className="btn btn-primary" onClick={handlePasswordSubmit}>Submit</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SettingsPage;