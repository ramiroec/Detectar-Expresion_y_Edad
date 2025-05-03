
# MotionDetector

Un componente de React para detectar movimiento en tiempo real usando la cámara web del navegador. Muestra una alerta visual cuando se detecta un cambio significativo entre frames consecutivos.

## 🎥 Características

- Detección de movimiento basada en diferencias de píxeles.
- Sensibilidad ajustable.
- Alerta visual en pantalla cuando se detecta movimiento.
- Uso de `react-webcam` y `canvas` HTML5 para procesamiento de imágenes.

## 🚀 Instalación

1. Asegúrate de tener un proyecto de React con TypeScript.
2. Instala las dependencias necesarias:

```bash
npm install react-webcam
```

3. Copia el archivo `MotionDetector.tsx` en tu proyecto (por ejemplo, dentro de `src/components/`).

## 🧠 Uso

Importa y utiliza el componente en tu aplicación:

```tsx
import React from 'react';
import MotionDetector from './components/MotionDetector';

function App() {
  return (
    <div>
      <MotionDetector />
    </div>
  );
}

export default App;
```

## ⚙️ Props

Actualmente el componente no recibe props, pero puedes extenderlo fácilmente para:
- Ejecutar una función cuando se detecte movimiento.
- Configurar la sensibilidad por defecto.
- Cambiar estilos de la alerta.

## 📷 Permisos

Este componente requiere acceso a la cámara del usuario. Asegúrate de que tu navegador tenga permiso para usarla.

## 🛠 Tecnologías

- React
- TypeScript
- HTML Canvas
- `react-webcam`

## 📄 Licencia

Este proyecto está bajo la licencia MIT.

---

¡Contribuciones, mejoras y forks son bienvenidos! 🚀
