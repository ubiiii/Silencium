import React, { useEffect, useRef, memo, useState } from 'react';

const CanvasImageRenderer = memo(({ imageData, imageName }) => {
  const canvasRef = useRef(null);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !imageData) return;

    if (import.meta.env.DEV) {
      console.log('Attempting to load image:', imageData.substring(0, 100) + '...');
    }
    
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
      if (import.meta.env.DEV) {
        console.log('Image loaded successfully, dimensions:', img.width, 'x', img.height);
      }
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);
    };
    
    img.onerror = (error) => {
      console.error('Failed to load image:', error);
      console.error('Image data preview:', imageData.substring(0, 200));
    };
    
    img.src = imageData;
  }, [imageData]);

  const handleImageClick = () => {
    setIsFullScreen(true);
    setZoom(1);
    setPosition({ x: 0, y: 0 });
  };

  const handleClose = () => {
    setIsFullScreen(false);
    setZoom(1);
    setPosition({ x: 0, y: 0 });
  };

  const handleDownload = () => {
    const link = document.createElement('a');
    link.download = imageName || 'image';
    link.href = imageData;
    link.click();
  };

  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev * 1.5, 5));
  };

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev / 1.5, 0.1));
  };

  const handleMouseDown = (e) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
  };

  const handleMouseMove = (e) => {
    if (isDragging) {
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleWheel = (e) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setZoom(prev => Math.max(0.1, Math.min(5, prev * delta)));
  };

  // Use useEffect to add wheel event listener with passive: false
  useEffect(() => {
    if (!isFullScreen) return;

    const handleWheelPassive = (e) => {
      e.preventDefault();
      const delta = e.deltaY > 0 ? 0.9 : 1.1;
      setZoom(prev => Math.max(0.1, Math.min(5, prev * delta)));
    };

    document.addEventListener('wheel', handleWheelPassive, { passive: false });

    return () => {
      document.removeEventListener('wheel', handleWheelPassive);
    };
  }, [isFullScreen]);

  if (!imageData) {
    return <div>No image data</div>;
  }

  if (isFullScreen) {
    return (
      <div 
        className="fullscreen-overlay"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          backgroundColor: 'rgba(0, 0, 0, 0.9)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: isDragging ? 'grabbing' : 'grab'
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
      >
        {/* Close button */}
        <button
          onClick={handleClose}
          style={{
            position: 'absolute',
            top: '20px',
            left: '20px',
            background: 'rgba(255, 0, 0, 0.8)',
            border: 'none',
            borderRadius: '50%',
            width: '40px',
            height: '40px',
            color: 'white',
            fontSize: '20px',
            cursor: 'pointer',
            zIndex: 10000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          ✕
        </button>

        {/* Download button */}
        <button
          onClick={handleDownload}
          style={{
            position: 'absolute',
            top: '20px',
            right: '20px',
            background: 'rgba(0, 255, 0, 0.8)',
            border: 'none',
            borderRadius: '5px',
            padding: '10px 15px',
            color: 'white',
            fontSize: '14px',
            cursor: 'pointer',
            zIndex: 10000
          }}
        >
          📥 Download
        </button>

        {/* Zoom controls */}
        <div
          style={{
            position: 'absolute',
            bottom: '20px',
            left: '50%',
            transform: 'translateX(-50%)',
            display: 'flex',
            gap: '10px',
            zIndex: 10000
          }}
        >
          <button
            onClick={handleZoomOut}
            style={{
              background: 'rgba(0, 0, 0, 0.8)',
              border: 'none',
              borderRadius: '5px',
              padding: '10px 15px',
              color: 'white',
              fontSize: '16px',
              cursor: 'pointer'
            }}
          >
            🔍-
          </button>
          <span
            style={{
              background: 'rgba(0, 0, 0, 0.8)',
              color: 'white',
              padding: '10px 15px',
              borderRadius: '5px',
              fontSize: '14px'
            }}
          >
            {Math.round(zoom * 100)}%
          </span>
          <button
            onClick={handleZoomIn}
            style={{
              background: 'rgba(0, 0, 0, 0.8)',
              border: 'none',
              borderRadius: '5px',
              padding: '10px 15px',
              color: 'white',
              fontSize: '16px',
              cursor: 'pointer'
            }}
          >
            🔍+
          </button>
        </div>

        {/* Image container */}
        <div
          style={{
            transform: `scale(${zoom}) translate(${position.x / zoom}px, ${position.y / zoom}px)`,
            transition: isDragging ? 'none' : 'transform 0.1s ease',
            cursor: isDragging ? 'grabbing' : 'grab'
          }}
        >
          <img
            src={imageData}
            alt="Full screen image"
            style={{
              maxWidth: '90vw',
              maxHeight: '90vh',
              objectFit: 'contain',
              userSelect: 'none',
              pointerEvents: 'none'
            }}
            onContextMenu={(e) => e.preventDefault()}
          />
        </div>
      </div>
    );
  }

  return (
    <div 
      style={{ 
        position: 'relative', 
        display: 'inline-block',
        borderRadius: '8px',
        overflow: 'hidden',
        transition: 'transform 0.2s ease, box-shadow 0.2s ease'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'scale(1.02)';
        e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 255, 0, 0.3)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'scale(1)';
        e.currentTarget.style.boxShadow = 'none';
      }}
    >
      <canvas
        ref={canvasRef}
        style={{
          maxWidth: '100%',
          userSelect: 'none',
          pointerEvents: 'none',
          display: 'block'
        }}
        onContextMenu={(e) => e.preventDefault()}
      />
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          cursor: 'pointer',
          backgroundColor: 'transparent',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
        onClick={handleImageClick}
        title="Click to view full screen"
        onMouseEnter={(e) => {
          const overlay = e.currentTarget.querySelector('.hover-overlay');
          if (overlay) overlay.style.opacity = '1';
        }}
        onMouseLeave={(e) => {
          const overlay = e.currentTarget.querySelector('.hover-overlay');
          if (overlay) overlay.style.opacity = '0';
        }}
      >
        <div
          style={{
            background: 'rgba(0, 0, 0, 0.7)',
            color: 'white',
            padding: '8px 12px',
            borderRadius: '20px',
            fontSize: '12px',
            opacity: 0,
            transition: 'opacity 0.2s ease',
            pointerEvents: 'none'
          }}
          className="hover-overlay"
        >
          🔍 View Full Screen
        </div>
      </div>
    </div>
  );
});

CanvasImageRenderer.displayName = 'CanvasImageRenderer';

export default CanvasImageRenderer;
