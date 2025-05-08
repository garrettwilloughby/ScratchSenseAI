import { useState, useRef, useEffect } from "react";

// Custom hook for logging messages
export const useConsoleLogs = () => {
  const [consoleLogs, setConsoleLogs] = useState([]); // State to store console logs
  const logContainerRef = useRef(null); // Ref for console log container

  // Function to add a new message to the log
  const logMessage = (message) => {
    setConsoleLogs((prevLogs) => [...prevLogs, message]);
  };

  // Scroll to the bottom after the logs are updated
  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [consoleLogs]); // Re-run the effect whenever consoleLogs change

  return { consoleLogs, logMessage, logContainerRef };
};
