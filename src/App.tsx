// App.tsx
import React, { useState } from "react";
import MotionDetector from "./MotionDetector";
import FaceDetector from "./FaceDetector";

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'motion' | 'face'>('motion');

  return (
    <div style={{ maxWidth: "800px", margin: "0 auto", padding: "20px" }}>
      <h1 style={{ textAlign: "center", marginBottom: "20px" }}>Sistema de Detección</h1>
      
      <div style={{ display: "flex", justifyContent: "center", marginBottom: "20px" }}>
        <button
          onClick={() => setActiveTab('motion')}
          style={{
            padding: "10px 20px",
            backgroundColor: activeTab === 'motion' ? "#3498db" : "#e0e0e0",
            color: activeTab === 'motion' ? "white" : "black",
            border: "none",
            borderRadius: "5px 0 0 5px",
            cursor: "pointer",
            fontWeight: activeTab === 'motion' ? "bold" : "normal"
          }}
        >
          Detección de Movimiento
        </button>
        <button
          onClick={() => setActiveTab('face')}
          style={{
            padding: "10px 20px",
            backgroundColor: activeTab === 'face' ? "#3498db" : "#e0e0e0",
            color: activeTab === 'face' ? "white" : "black",
            border: "none",
            borderRadius: "0 5px 5px 0",
            cursor: "pointer",
            fontWeight: activeTab === 'face' ? "bold" : "normal"
          }}
        >
          Detección de Rostros
        </button>
      </div>
      
      {activeTab === 'motion' ? <MotionDetector /> : <FaceDetector />}
    </div>
  );
};

export default App;