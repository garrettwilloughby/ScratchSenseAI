import React from 'react';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUpload, faDatabase, faCog, faChartBar, faBrain } from '@fortawesome/free-solid-svg-icons';

function HomePage() {
  // Define custom styles
  const buttonStyle = {
    margin: '10px',
    width: '260px',
    height: '160px',
    fontSize: '1.25rem',
    transition: 'all 0.25s ease-in-out',
    backgroundColor: '#ffffff',
    border: '1px solid #dee2e6',
    borderRadius: '1rem',
    color: '#343a40',
    fontWeight: '500',
  };

  const hoverStyle = `
    .custom-btn:hover {
      background-color: #e9ecef;
      transform: translateY(-4px) scale(1.02);
      box-shadow: 0 12px 24px rgba(0, 0, 0, 0.1);
    }
    .custom-btn {
      transition: all 0.25s ease-in-out;
    }
  `;

  return (
    <>
      <style>{hoverStyle}</style>
      <div className="d-flex justify-content-center align-items-center">
        <div className="container text-center">
          <h1 className="mb-5 mt-5 fw-bold text-dark">Welcome</h1>
          
          {/* Grid Row 1 */}
          <div className="d-flex justify-content-center flex-wrap">
            <Link to="/upload">
              <button className="dft-btn" style={buttonStyle}>
                <FontAwesomeIcon icon={faUpload} /> Upload
              </button>
            </Link>
            <Link to="/data">
              <button className="dft-btn" style={buttonStyle}>
                <FontAwesomeIcon icon={faDatabase} /> Data
              </button>
            </Link>
            <Link to="/training">
              <button className="dft-btn" style={buttonStyle}>
                <FontAwesomeIcon icon={faBrain} /> Training
              </button>
            </Link>
          </div>

          {/* Grid Row 2 */}
          <div className="d-flex justify-content-center flex-wrap mt-3">
            <Link to="/metrics">
              <button className="dft-btn" style={buttonStyle}>
                <FontAwesomeIcon icon={faChartBar} /> Metrics
              </button>
            </Link>
            <Link to="/settings">
              <button className="dft-btn" style={buttonStyle}>
                <FontAwesomeIcon icon={faCog} /> Settings
              </button>
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}

export default HomePage;
