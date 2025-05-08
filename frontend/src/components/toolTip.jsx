import React, { useState, useRef, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEye } from "@fortawesome/free-solid-svg-icons";

const Tooltip = ({ text }) => {
  const [visible, setVisible] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const triggerRef = useRef(null);

  // Update position when visibility changes
  useEffect(() => {
    if (visible && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setPosition({
        top: rect.top + rect.height / 2 + window.scrollY, // centered vertically with the icon
        left: rect.right + window.scrollX + 10, // 10px to the right of the icon
      });
    }
  }, [visible]);

  return (
    <span className="inline-block relative">
      <span
        ref={triggerRef}
        className="inline-flex items-center cursor-pointer"
        onMouseEnter={() => setVisible(true)}
        onMouseLeave={() => setVisible(false)}
      >
        <FontAwesomeIcon icon={faEye} className="text-gray-700" />
      </span>
      
      {visible && (
        <div 
          style={{
            position: "fixed",
            zIndex: 9999,
            top: `${position.top}px`,
            left: `${position.left}px`,
            transform: "translateY(-50%)", // Center vertically
            backgroundColor: "black",
            color: "white",
            padding: "10px 12px",
            borderRadius: "6px",
            fontSize: "14px",
            boxShadow: "0 2px 10px rgba(0,0,0,0.2)",
            opacity: 0.9,
            maxWidth: "500px", // Set maximum width
            maxHeight: "150px", // Set maximum height
            overflow: "auto", // Add scrollbar if content exceeds max dimensions
            lineHeight: "1.4",
            pointerEvents: "none"
          }}
        >
          {text}
        </div>
      )}
    </span>
  );
};

export default Tooltip;