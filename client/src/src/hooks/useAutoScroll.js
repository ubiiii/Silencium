import { useEffect } from 'react';

/**
 * Auto-scrolls to the bottom of a referenced element whenever the dependency changes.
 * @param {React.RefObject} ref - The element to scroll into view.
 * @param {any} dependency - Triggers scroll when it changes (e.g., messages array).
 * @param {string} behavior - 'auto' or 'smooth' scroll.
 */
export default function useAutoScroll(ref, dependency, behavior = 'smooth') {
  useEffect(() => {
    if (ref?.current) {
      ref.current.scrollIntoView({ behavior });
    }
  }, [dependency, behavior, ref]);
}
