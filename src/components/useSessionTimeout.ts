// useSessionTimeout.ts
import { useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

export function useSessionTimeout(timeoutMinutes: number = 60) {
  const { logOut } = useAuth();

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    const resetTimer = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        alert('Your session has expired due to inactivity. Please log in again.');
        logOut();
      }, timeoutMinutes * 60 * 1000);
    };

    window.addEventListener('mousemove', resetTimer);
    window.addEventListener('keypress', resetTimer);
    window.addEventListener('click', resetTimer);

    resetTimer();

    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('mousemove', resetTimer);
      window.removeEventListener('keypress', resetTimer);
      window.removeEventListener('click', resetTimer);
    };
  }, [logOut, timeoutMinutes]);
}