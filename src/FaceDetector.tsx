// FaceDetector.tsx
import React, { useRef, useState, useEffect } from "react";
import Webcam from "react-webcam";
import * as faceapi from 'face-api.js';

const VIDEO_WIDTH = 640;
const VIDEO_HEIGHT = 360;

interface FaceData {
  gender: string;
  age: number;
  emotion: string;
  expressions: Record<string, number>;
}

const FaceDetector: React.FC = () => {
  const webcamRef = useRef<Webcam>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isModelLoaded, setIsModelLoaded] = useState(false);
  const [facesDetected, setFacesDetected] = useState(0);
  const [detectionEnabled, setDetectionEnabled] = useState(true);
  const [facesData, setFacesData] = useState<FaceData[]>([]);
  const [displayMode, setDisplayMode] = useState<'landmarks' | 'expressions' | 'mesh'>('landmarks');
  const [showDetails, setShowDetails] = useState(true);
  const detectionInterval = useRef<NodeJS.Timeout>();

  const videoConstraints = {
    width: VIDEO_WIDTH,
    height: VIDEO_HEIGHT,
    facingMode: "user",
  };

  // Carga los modelos de face-api.js
  const loadModels = async () => {
    try {
      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri('/models'),
        faceapi.nets.faceLandmark68Net.loadFromUri('/models'),
        faceapi.nets.faceRecognitionNet.loadFromUri('/models'),
        faceapi.nets.faceExpressionNet.loadFromUri('/models'),
        faceapi.nets.ageGenderNet.loadFromUri('/models')
      ]);
      setIsModelLoaded(true);
      console.log("Modelos cargados correctamente");
    } catch (error) {
      console.error("Error al cargar los modelos:", error);
    }
  };

  // Obtener la expresión dominante
  const getDominantExpression = (expressions: faceapi.FaceExpressions): string => {
    let maxValue = 0;
    let dominantExpression = '';
    
    Object.entries(expressions).forEach(([expression, value]) => {
      if (value > maxValue) {
        maxValue = value;
        dominantExpression = expression;
      }
    });
    
    return dominantExpression;
  };

  // Mapea expresiones a emojis
  const getExpressionEmoji = (expression: string): string => {
    const emojiMap: Record<string, string> = {
      'neutral': '😐',
      'happy': '😀',
      'sad': '😔',
      'angry': '😠',
      'fearful': '😨',
      'disgusted': '🤢',
      'surprised': '😲'
    };
    
    return emojiMap[expression] || '❓';
  };

  // Detecta rostros en el video
  const detectFaces = async () => {
    if (!webcamRef.current?.video || !canvasRef.current || !isModelLoaded || !detectionEnabled) return;

    const video = webcamRef.current.video;
    const canvas = canvasRef.current;
    const displaySize = { width: video.width, height: video.height };
    
    // Asegurarse de que las dimensiones del canvas coincidan con el video
    faceapi.matchDimensions(canvas, displaySize);
    
    try {
      const detections = await faceapi.detectAllFaces(
        video, 
        new faceapi.TinyFaceDetectorOptions({ scoreThreshold: 0.5 })
      )
      .withFaceLandmarks()
      .withFaceExpressions()
      .withAgeAndGender();
      
      // Actualizar el número de rostros detectados
      setFacesDetected(detections.length);
      
      // Extraer datos de los rostros
      const faceDataArray: FaceData[] = detections.map(detection => {
        const expressions = detection.expressions;
        const dominantExpression = getDominantExpression(expressions);
        
        return {
          gender: detection.gender || 'desconocido',
          age: Math.round(detection.age || 0),
          emotion: dominantExpression,
          expressions: Object.fromEntries(
            Object.entries(expressions).map(([key, value]) => [key, parseFloat(value.toFixed(2))])
          )
        };
      });
      
      setFacesData(faceDataArray);
      
      // Limpiar canvas y dibujar detecciones
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
      
      const resizedDetections = faceapi.resizeResults(detections, displaySize);
      
      // Dibujar cajas de detección
      faceapi.draw.drawDetections(canvas, resizedDetections);
      
      // Dibujar según el modo seleccionado
      if (displayMode === 'landmarks') {
        faceapi.draw.drawFaceLandmarks(canvas, resizedDetections);
      } else if (displayMode === 'expressions') {
        faceapi.draw.drawFaceExpressions(canvas, resizedDetections);
      } else if (displayMode === 'mesh') {
        // Dibujar malla facial personalizada
        resizedDetections.forEach(detection => {
          const landmarks = detection.landmarks;
          const points = landmarks.positions;
          
          if (ctx) {
            ctx.strokeStyle = '#36f';
            ctx.lineWidth = 1;
            
            // Conectar puntos para formar una malla
            for (let i = 0; i < points.length; i++) {
              const point = points[i];
              ctx.beginPath();
              ctx.arc(point.x, point.y, 2, 0, 2 * Math.PI);
              ctx.fillStyle = '#36f';
              ctx.fill();
            }
          }
        });
      }
      
      // Dibujar información adicional
      if (showDetails) {
        resizedDetections.forEach((detection, idx) => {
          const box = detection.detection.box;
          const faceData = faceDataArray[idx];
          
          if (ctx) {
            // Fondo para el texto
            ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
            ctx.fillRect(
              box.x, 
              box.y - 50, 
              box.width, 
              50
            );
            
            // Información de edad y género
            ctx.font = '16px Arial';
            ctx.fillStyle = 'white';
            ctx.fillText(
              `${faceData.age} años, ${faceData.gender === 'male' ? 'Hombre' : 'Mujer'}`,
              box.x + 5, 
              box.y - 30
            );
            
            // Emoción dominante con emoji
            ctx.font = '20px Arial';
            ctx.fillText(
              `${getExpressionEmoji(faceData.emotion)} ${faceData.emotion}`,
              box.x + 5, 
              box.y - 10
            );
          }
        });
      }
    } catch (error) {
      console.error("Error en la detección facial:", error);
    }
  };

  // Iniciar la detección de rostros al cargar el componente
  useEffect(() => {
    loadModels();
    
    return () => {
      if (detectionInterval.current) {
        clearInterval(detectionInterval.current);
      }
    };
  }, []);

  // Configurar el intervalo de detección cuando los modelos están cargados
  useEffect(() => {
    if (isModelLoaded && detectionEnabled) {
      detectionInterval.current = setInterval(detectFaces, 1500); // Reducido para mejorar rendimiento
    } else if (detectionInterval.current) {
      clearInterval(detectionInterval.current);
    }
    
    return () => {
      if (detectionInterval.current) {
        clearInterval(detectionInterval.current);
      }
    };
  }, [isModelLoaded, detectionEnabled, displayMode, showDetails]);

  return (
    <div style={{ textAlign: "center", position: "relative" }}>
      <h2>Análisis Facial Avanzado</h2>
      
      <div style={{ marginBottom: "20px", display: "flex", justifyContent: "center", gap: "10px" }}>
        <button
          onClick={() => setDetectionEnabled(!detectionEnabled)}
          style={{
            padding: "8px 16px",
            backgroundColor: detectionEnabled ? "#ff4757" : "#2ed573",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer"
          }}
        >
          {detectionEnabled ? "Pausar Detección" : "Iniciar Detección"}
        </button>
        
        <select 
          value={displayMode}
          onChange={(e) => setDisplayMode(e.target.value as 'landmarks' | 'expressions' | 'mesh')}
          style={{
            padding: "8px 16px",
            border: "1px solid #ddd",
            borderRadius: "4px",
            cursor: "pointer"
          }}
        >
          <option value="landmarks">Puntos de referencia</option>
          <option value="expressions">Expresiones</option>
          <option value="mesh">Malla facial</option>
        </select>
        
        <button
          onClick={() => setShowDetails(!showDetails)}
          style={{
            padding: "8px 16px",
            backgroundColor: showDetails ? "#f39c12" : "#7f8c8d",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer"
          }}
        >
          {showDetails ? "Ocultar Detalles" : "Mostrar Detalles"}
        </button>
      </div>
      
      <div style={{ position: "relative", display: "inline-block" }}>
        <Webcam
          audio={false}
          ref={webcamRef}
          width={VIDEO_WIDTH}
          height={VIDEO_HEIGHT}
          videoConstraints={videoConstraints}
          screenshotFormat="image/jpeg"
          style={{ borderRadius: "8px" }}
        />
        
        <canvas
          ref={canvasRef}
          width={VIDEO_WIDTH}
          height={VIDEO_HEIGHT}
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            zIndex: 10
          }}
        />
        
        <div style={{
          position: "absolute",
          bottom: "10px",
          right: "10px",
          backgroundColor: "rgba(0, 0, 0, 0.7)",
          color: "white",
          padding: "5px 10px",
          borderRadius: "4px",
          fontSize: "14px"
        }}>
          Rostros detectados: {facesDetected}
        </div>
      </div>
      
      {!isModelLoaded && (
        <div style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          backgroundColor: "rgba(0, 0, 0, 0.7)",
          color: "white",
          padding: "20px",
          borderRadius: "10px",
          zIndex: 20
        }}>
          Cargando modelos de detección...
        </div>
      )}
      
      {facesData.length > 0 && (
        <div style={{ 
          marginTop: "20px", 
          textAlign: "left", 
          maxWidth: VIDEO_WIDTH, 
          margin: "20px auto",
          backgroundColor: "#0c2742ff",
          padding: "15px",
          borderRadius: "8px",
          boxShadow: "0 2px 5px rgba(0,0,0,0.1)"
        }}>
          <h3 style={{ marginTop: 0 }}>Información Detallada</h3>
          
          {facesData.map((face, index) => (
            <div key={index} style={{ marginBottom: "15px", padding: "10px", border: "1px solid #ddd", borderRadius: "5px" }}>
              <h4 style={{ margin: "0 0 10px 0" }}>Rostro #{index + 1}</h4>
              <div>
                <strong>Edad estimada:</strong> {face.age} años
              </div>
              <div>
                <strong>Género:</strong> {face.gender === 'male' ? 'Hombre' : 'Mujer'}
              </div>
              <div>
                <strong>Emoción dominante:</strong> {getExpressionEmoji(face.emotion)} {face.emotion}
              </div>
              
              <div style={{ marginTop: "10px" }}>
                <strong>Niveles de expresión:</strong>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "5px", marginTop: "5px" }}>
                  {Object.entries(face.expressions).map(([expr, value]) => (
                    <div 
                      key={expr} 
                      style={{ 
                        padding: "3px 8px", 
                        backgroundColor: expr === face.emotion ? "#3498db" : "#e0e0e0",
                        color: expr === face.emotion ? "white" : "black",
                        borderRadius: "15px",
                        fontSize: "12px"
                      }}
                    >
                      {expr}: {value}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FaceDetector;