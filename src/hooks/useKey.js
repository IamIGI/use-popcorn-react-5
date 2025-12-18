import { useEffect } from 'react';

export function useKey(key, action) {
  useEffect(() => {
    function callback(e) {
      if (e.code.toLowerCase() === key.toLowerCase()) {
        action();
      }
    }

    document.addEventListener('keydown', (e) => callback(e));

    return () => document.removeEventListener('keydown', (e) => callback(e));
  }, [key, action]);
}
