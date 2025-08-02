import { useEffect, useRef } from 'react';

const CanvasImageRenderer = ({ imageData }) => {
    console.log('Rendering image of length:', imageData?.length);
  const canvasRef = useRef(null);

    useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);
    };
    img.src = imageData;
    }, [imageData]);


  return (
    <canvas
      ref={canvasRef}
      style={{
        maxWidth: '100%',
        userSelect: 'none',
        pointerEvents: 'none'
      }}
      onContextMenu={(e) => e.preventDefault()}
    />
  );
};

export default CanvasImageRenderer;
