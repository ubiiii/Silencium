import { useEffect, useRef, memo } from 'react';

const CanvasImageRenderer = memo(({ imageData, onClick, onScreenshotDetected, protectionEnabled = true }) => {
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

  // Screenshot protection handlers
  const handleContextMenu = (e) => {
    if (protectionEnabled) {
      e.preventDefault();
      if (onScreenshotDetected) {
        onScreenshotDetected('context_menu');
      }
    }
  };

  const handleMouseDown = (e) => {
    // Detect right-click (button 2) and long press
    if (e.button === 2 && protectionEnabled) {
      e.preventDefault();
      if (onScreenshotDetected) {
        onScreenshotDetected('right_click');
      }
    }
  };

  const handleAuxClick = (e) => {
    // Detect middle-click
    if (protectionEnabled) {
      e.preventDefault();
      if (onScreenshotDetected) {
        onScreenshotDetected('middle_click');
      }
    }
  };

  const handleDragStart = (e) => {
    if (protectionEnabled) {
      e.preventDefault();
      if (onScreenshotDetected) {
        onScreenshotDetected('drag_attempt');
      }
    }
  };

  const handleKeyDown = (e) => {
    // Detect common screenshot shortcuts
    const isScreenshotShortcut = (
      (e.ctrlKey && e.shiftKey && e.key === '3') || // macOS Cmd+Shift+3
      (e.ctrlKey && e.shiftKey && e.key === '4') || // macOS Cmd+Shift+4
      (e.ctrlKey && e.key === 'PrintScreen') || // Windows Ctrl+PrintScreen
      (e.key === 'PrintScreen') || // PrintScreen key
      (e.ctrlKey && e.key === 's' && e.altKey) // Windows Alt+Ctrl+S
    );

    if (isScreenshotShortcut && protectionEnabled) {
      e.preventDefault();
      if (onScreenshotDetected) {
        onScreenshotDetected('keyboard_shortcut');
      }
    }
  };

  return (
    <canvas
      ref={canvasRef}
      style={{
        maxWidth: '100%',
        userSelect: 'none',
        WebkitUserSelect: 'none',
        MozUserSelect: 'none',
        msUserSelect: 'none',
        pointerEvents: onClick ? 'auto' : 'none',
        cursor: onClick ? 'pointer' : 'default',
        touchAction: 'none'
      }}
      onContextMenu={handleContextMenu}
      onMouseDown={handleMouseDown}
      onAuxClick={handleAuxClick}
      onDragStart={handleDragStart}
      onKeyDown={handleKeyDown}
      onClick={handleClick}
      tabIndex={-1}
      draggable={false}
    />
  );
});

CanvasImageRenderer.displayName = 'CanvasImageRenderer';

export default CanvasImageRenderer;
