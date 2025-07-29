// animations.js

/**
 * Smoothly scroll to bottom of a container.
 */
export function scrollToBottom(ref, behavior = 'smooth') {
  if (ref?.current) {
    ref.current.scrollIntoView({ behavior });
  }
}

/**
 * Apply fade-in effect manually to any element.
 */
export function fadeIn(element, duration = 300) {
  if (!element) return;
  element.style.opacity = 0;
  element.style.transition = `opacity ${duration}ms ease-in-out`;
  requestAnimationFrame(() => {
    element.style.opacity = 1;
  });
}

/**
 * Blink caret effect for terminal UIs
 */
export function createBlinkEffect(element) {
  if (!element) return;
  element.classList.add('blink-caret'); // CSS must define .blink-caret animation
}
