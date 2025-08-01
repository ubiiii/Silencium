import { useEffect, useRef, memo } from 'react';

const CanvasImageRenderer = memo(({ imageData, onClick }) => {
  // Remove or comment out the console.log to eliminate spam
  // console.log('Rendering image of length:', imageData?.length);
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

  const handleClick = (e) => {
    e.stopPropagation();
    if (onClick) {
      onClick();
    }
  };

  return (
    <canvas
      ref={canvasRef}
      style={{
        maxWidth: '100%',
        userSelect: 'none',
        pointerEvents: onClick ? 'auto' : 'none',
        cursor: onClick ? 'pointer' : 'default'
      }}
      onContextMenu={(e) => e.preventDefault()}
      onClick={handleClick}
    />
  );
});

CanvasImageRenderer.displayName = 'CanvasImageRenderer';

export default CanvasImageRenderer;
