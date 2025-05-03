// MotionDetector.tsx
import React, { useRef, useState, useEffect } from "react";
import Webcam from "react-webcam";

const VIDEO_WIDTH = 640;
const VIDEO_HEIGHT = 360;

const MotionDetector: React.FC = () => {
  const webcamRef = useRef<Webcam>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const detectionTimeout = useRef<NodeJS.Timeout>();

  const [motionDetected, setMotionDetected] = useState(false);
  const [sensitivity, setSensitivity] = useState(30); // Sensibilidad entre 10 y 100

  const videoConstraints = {
    width: VIDEO_WIDTH,
    height: VIDEO_HEIGHT,
    facingMode: "user",
  };

  // Compara los píxeles de dos frames y detecta si hay movimiento
  const isMotionDetected = (
    currentFrame: ImageData,
    prevFrame: ImageData,
    threshold: number,
    motionRatioThreshold: number = 0.02
  ): boolean => {
    let diffCount = 0;

    for (let i = 0; i < currentFrame.data.length; i += 4) {
      const rDiff = Math.abs(currentFrame.data[i] - prevFrame.data[i]);
      const gDiff = Math.abs(currentFrame.data[i + 1] - prevFrame.data[i + 1]);
      const bDiff = Math.abs(currentFrame.data[i + 2] - prevFrame.data[i + 2]);

      const totalDiff = rDiff + gDiff + bDiff;
      if (totalDiff > threshold) diffCount++;
    }

    const totalPixels = currentFrame.data.length / 4;
    return diffCount / totalPixels > motionRatioThreshold;
  };

  // Guarda el frame actual como string en el dataset del canvas
  const saveFrame = (canvas: HTMLCanvasElement, frame: ImageData) => {
    canvas.dataset.prevFrame = JSON.stringify({
      data: Array.from(frame.data),
      width: frame.width,
      height: frame.height,
    });
  };

  const detectMotion = () => {
    const video = webcamRef.current?.video;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");

    if (!video || !canvas || !ctx) return;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const currentFrame = ctx.getImageData(0, 0, canvas.width, canvas.height);

    const prevFrameData = canvas.dataset.prevFrame;
    if (prevFrameData) {
      const parsed = JSON.parse(prevFrameData);
      const prevFrame = new ImageData(
        new Uint8ClampedArray(parsed.data),
        parsed.width,
        parsed.height
      );

      if (isMotionDetected(currentFrame, prevFrame, sensitivity)) {
        setMotionDetected(true);
        if (detectionTimeout.current) clearTimeout(detectionTimeout.current);
        detectionTimeout.current = setTimeout(() => setMotionDetected(false), 2000);
      }
    }

    saveFrame(canvas, currentFrame);
    requestAnimationFrame(detectMotion);
  };

  useEffect(() => {
    const animationId = requestAnimationFrame(detectMotion);
    return () => {
      cancelAnimationFrame(animationId);
      if (detectionTimeout.current) clearTimeout(detectionTimeout.current);
    };
  }, [sensitivity]);

  return (
    <div style={{ textAlign: "center", position: "relative" }}>
      <h2>Detección de Movimiento</h2>

      <div style={{ marginBottom: "20px" }}>
        <label>Sensibilidad: </label>
        <input
          type="range"
          min="10"
          max="100"
          value={sensitivity}
          onChange={(e) => setSensitivity(Number(e.target.value))}
        />
        <span> {sensitivity}</span>
      </div>

      <Webcam
        audio={false}
        ref={webcamRef}
        width={VIDEO_WIDTH}
        height={VIDEO_HEIGHT}
        videoConstraints={videoConstraints}
        screenshotFormat="image/jpeg"
        style={{ border: `3px solid ${motionDetected ? "red" : "green"}` }}
      />

      <canvas
        ref={canvasRef}
        width={VIDEO_WIDTH}
        height={VIDEO_HEIGHT}
        style={{ display: "none" }}
      />

      {motionDetected && (
        <div style={styles.motionAlert}>
          ¡Movimiento Detectado!
        </div>
      )}

      <style>{`
        @keyframes pulse {
          0% { transform: translate(-50%, -50%) scale(1); }
          50% { transform: translate(-50%, -50%) scale(1.05); }
          100% { transform: translate(-50%, -50%) scale(1); }
        }
      `}</style>
    </div>
  );
};

const styles = {
  motionAlert: {
    position: "absolute" as const,
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    backgroundColor: "rgba(255, 0, 0, 0.7)",
    color: "white",
    padding: "20px",
    borderRadius: "10px",
    fontSize: "24px",
    fontWeight: "bold",
    animation: "pulse 1s infinite",
  },
};

export default MotionDetector;
