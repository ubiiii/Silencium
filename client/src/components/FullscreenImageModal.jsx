import React, { useState, useRef, useEffect, useCallback } from 'react';
import './FullscreenImageModal.css';

const FullscreenImageModal = ({ isOpen, imageData, onClose, onScreenshotDetected, protectionEnabled = true }) => {
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [isVisible, setIsVisible] = useState(true);
  const imageRef = useRef(null);
  const imageContainerRef = useRef(null);
  const modalRef = useRef(null);

  // Reset zoom and position when modal opens
  useEffect(() => {
    if (isOpen) {
      setScale(1);
      setPosition({ x: 0, y: 0 });
      setIsVisible(true);
    }
  }, [isOpen]);

  // Screenshot protection and visibility detection
  useEffect(() => {
    if (!isOpen) return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        if (protectionEnabled) {
          setIsVisible(false);
          // Notify server about potential screenshot
          if (onScreenshotDetected) {
            onScreenshotDetected('visibility_change');
          }
        }
      } else {
        // Small delay to prevent flickering
        setTimeout(() => setIsVisible(true), 100);
      }
    };

    const handleBlur = () => {
      if (protectionEnabled) {
        setIsVisible(false);
        if (onScreenshotDetected) {
          onScreenshotDetected('window_blur');
        }
      }
    };

    const handleFocus = () => {
      setTimeout(() => setIsVisible(true), 100);
    };

    // Screenshot detection using various methods
    const handleKeyDown = (e) => {
      // Detect common screenshot shortcuts
      const isScreenshotShortcut = (
        (e.ctrlKey && e.shiftKey && e.key === '3') || // macOS Cmd+Shift+3
        (e.ctrlKey && e.shiftKey && e.key === '4') || // macOS Cmd+Shift+4
        (e.ctrlKey && e.key === 'PrintScreen') || // Windows Ctrl+PrintScreen
        (e.key === 'PrintScreen') || // PrintScreen key
        (e.ctrlKey && e.key === 's' && e.altKey) || // Windows Alt+Ctrl+S
        (e.metaKey && e.shiftKey && e.key === '3') || // macOS Cmd+Shift+3
        (e.metaKey && e.shiftKey && e.key === '4') || // macOS Cmd+Shift+4
        (e.ctrlKey && e.key === 'p') || // Print dialog
        (e.metaKey && e.key === 'p') // macOS Print dialog
      );

      if (isScreenshotShortcut && protectionEnabled) {
        e.preventDefault();
        if (onScreenshotDetected) {
          onScreenshotDetected('keyboard_shortcut');
        }
      }
    };

    // Enhanced multi-monitor protection
    const handleMouseLeave = () => {
      // If mouse leaves the window, it might be going to another monitor
      if (onScreenshotDetected && protectionEnabled) {
        onScreenshotDetected('mouse_leave');
      }
    };

    const handleWindowResize = () => {
      // Window resize might indicate multi-monitor setup
      if (onScreenshotDetected && protectionEnabled) {
        onScreenshotDetected('window_resize');
      }
    };

    // Prevent context menu and other download methods
    const handleContextMenu = (e) => {
      if (protectionEnabled) {
        e.preventDefault();
        if (onScreenshotDetected) {
          onScreenshotDetected('context_menu');
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

    // Add event listeners
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleBlur);
    window.addEventListener('focus', handleFocus);
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('dragstart', handleDragStart);
    window.addEventListener('mouseleave', handleMouseLeave);
    window.addEventListener('resize', handleWindowResize);

    // CSS-based protection
    const style = document.createElement('style');
    style.textContent = `
      .screenshot-protection {
        -webkit-user-select: none !important;
        -moz-user-select: none !important;
        -ms-user-select: none !important;
        user-select: none !important;
        -webkit-touch-callout: none !important;
        -webkit-tap-highlight-color: transparent !important;
      }
      
      .screenshot-protection * {
        -webkit-user-select: none !important;
        -moz-user-select: none !important;
        -ms-user-select: none !important;
        user-select: none !important;
        -webkit-touch-callout: none !important;
      }
    `;
    document.head.appendChild(style);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleBlur);
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('dragstart', handleDragStart);
      window.removeEventListener('mouseleave', handleMouseLeave);
      window.removeEventListener('resize', handleWindowResize);
      document.head.removeChild(style);
    };
      }, [isOpen, onScreenshotDetected, protectionEnabled]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  // Manual wheel event listener to fix passive event warning
  useEffect(() => {
    const container = imageContainerRef.current;
    if (!container || !isOpen) return;

    const handleWheel = (e) => {
      e.preventDefault();
      const delta = e.deltaY > 0 ? 0.9 : 1.1;
      setScale(prev => Math.max(0.5, Math.min(5, prev * delta)));
    };

    container.addEventListener('wheel', handleWheel, { passive: false });

    return () => {
      container.removeEventListener('wheel', handleWheel, { passive: false });
    };
  }, [isOpen]);

  // Zoom handlers
  const handleZoomIn = useCallback(() => {
    setScale(prev => Math.min(prev * 1.5, 5));
  }, []);

  const handleZoomOut = useCallback(() => {
    setScale(prev => Math.max(prev / 1.5, 0.5));
  }, []);

  const handleResetZoom = useCallback(() => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  }, []);

  // Drag handlers
  const handleMouseDown = useCallback((e) => {
    if (scale > 1) {
      setIsDragging(true);
      setDragStart({
        x: e.clientX - position.x,
        y: e.clientY - position.y
      });
    }
  }, [scale, position]);

  const handleMouseMove = useCallback((e) => {
    if (isDragging && scale > 1) {
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    }
  }, [isDragging, scale, dragStart]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Touch events for mobile
  const handleTouchStart = useCallback((e) => {
    if (e.touches.length === 1 && scale > 1) {
      setIsDragging(true);
      setDragStart({
        x: e.touches[0].clientX - position.x,
        y: e.touches[0].clientY - position.y
      });
    }
  }, [scale, position]);

  const handleTouchMove = useCallback((e) => {
    if (isDragging && e.touches.length === 1 && scale > 1) {
      e.preventDefault();
      setPosition({
        x: e.touches[0].clientX - dragStart.x,
        y: e.touches[0].clientY - dragStart.y
      });
    }
  }, [isDragging, scale, dragStart]);

  if (!isOpen) return null;

  return (
    <div 
      ref={modalRef}
      className={`fullscreen-modal-overlay screenshot-protection ${!isVisible ? 'black-screen' : ''}`} 
      onClick={onClose}
      style={{
        backgroundColor: !isVisible ? '#000' : 'rgba(0, 0, 0, 0.9)',
        transition: 'background-color 0.2s ease'
      }}
    >
      <div 
        className="fullscreen-modal-content screenshot-protection" 
        onClick={(e) => e.stopPropagation()}
        style={{
          opacity: !isVisible ? 0 : 1,
          transition: 'opacity 0.2s ease'
        }}
      >
        {/* Close button */}
        <button className="close-button" onClick={onClose} aria-label="Close">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>

        {/* Zoom controls */}
        <div className="zoom-controls">
          <button onClick={handleZoomIn} aria-label="Zoom in">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2"/>
              <path d="M21 21L16.65 16.65" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M11 8V14M8 11H14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <span className="zoom-level">{Math.round(scale * 100)}%</span>
          <button onClick={handleZoomOut} aria-label="Zoom out">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2"/>
              <path d="M21 21L16.65 16.65" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M8 11H14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <button onClick={handleResetZoom} aria-label="Reset zoom">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M3 12A9 9 0 1 0 12 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M3 3L12 12L3 21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>

        {/* Image container */}
        <div 
          ref={imageContainerRef}
          className="image-container screenshot-protection"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleMouseUp}
          onContextMenu={(e) => e.preventDefault()}
          onDragStart={(e) => e.preventDefault()}
        >
          <img
            ref={imageRef}
            src={imageData}
            alt="Fullscreen view"
            className="fullscreen-image screenshot-protection"
            style={{
              transform: `scale(${scale}) translate(${position.x / scale}px, ${position.y / scale}px)`,
              cursor: scale > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default',
              pointerEvents: 'none',
              userSelect: 'none',
              WebkitUserSelect: 'none',
              MozUserSelect: 'none',
              msUserSelect: 'none'
            }}
            draggable={false}
            onContextMenu={(e) => e.preventDefault()}
            onDragStart={(e) => e.preventDefault()}
          />
        </div>

        {/* Instructions */}
        <div className="instructions">
          <p>Use mouse wheel or zoom buttons to zoom • Click and drag to pan when zoomed • Press ESC to close</p>
        </div>
      </div>
    </div>
  );
};

export default FullscreenImageModal;