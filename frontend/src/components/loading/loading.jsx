import React from 'react';
import './loading.css'; // We'll create a separate CSS file for styling the spinner

const Loading = () => {
  return (
    <div className="loading-container">
      <div className="spinner"></div>
    </div>
  );
};

export default Loading;
