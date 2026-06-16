// components/ClockInOut.tsx
import { useState, useEffect } from 'react';
import { Clock, Play, Square, CheckCircle, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ClockInOutProps {
  gigTitle: string;
  gigLocation: string;
  onClockIn?: (time: Date) => void;
  onClockOut?: (time: Date, duration: number) => void;
}

export default function ClockInOut({ gigTitle, gigLocation, onClockIn, onClockOut }: ClockInOutProps) {
  const [state, setState] = useState<'idle' | 'clocked-in' | 'clocked-out'>('idle');
  const [clockInTime, setClockInTime] = useState<Date | null>(null);
  const [elapsedTime, setElapsedTime] = useState<string>('00:00:00');
  const [showConfirmation, setShowConfirmation] = useState(false);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (state === 'clocked-in' && clockInTime) {
      interval = setInterval(() => {
        const now = new Date();
        const diff = now.getTime() - clockInTime.getTime();
        const hours = Math.floor(diff / 3600000);
        const minutes = Math.floor((diff % 3600000) / 60000);
        const seconds = Math.floor((diff % 60000) / 1000);
        setElapsedTime(`${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [state, clockInTime]);

  const handleClockIn = () => {
    const now = new Date();
    setClockInTime(now);
    setState('clocked-in');
    onClockIn?.(now);
    setShowConfirmation(true);
    setTimeout(() => setShowConfirmation(false), 3000);
  };

  const handleClockOut = () => {
    if (clockInTime) {
      const now = new Date();
      const duration = (now.getTime() - clockInTime.getTime()) / 1000 / 3600; // hours
      setState('clocked-out');
      onClockOut?.(now, duration);
      setShowConfirmation(true);
      setTimeout(() => setShowConfirmation(false), 3000);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-outline-variant p-4">
      <div className="flex items-center gap-2 mb-3">
        <Clock size={16} className="text-primary animate-pulse" />
        <span className="text-xs font-semibold text-on-surface">Current Shift</span>
      </div>
      
      <div className="mb-3">
        <p className="text-sm font-bold text-on-surface">{gigTitle}</p>
        <p className="text-xs text-on-surface-variant">{gigLocation}</p>
      </div>
      
      {state === 'clocked-in' && (
        <div className="mb-3 text-center">
          <p className="text-2xl font-mono font-bold text-primary">{elapsedTime}</p>
          <p className="text-[10px] text-on-surface-variant">Shift Duration</p>
        </div>
      )}
      
      <div className="flex gap-3">
        {state === 'idle' && (
          <button
            onClick={handleClockIn}
            className="flex-1 py-3 bg-primary text-white rounded-xl font-semibold text-sm hover:bg-primary/90 transition-all flex items-center justify-center gap-2"
          >
            <Play size={16} /> Clock In
          </button>
        )}
        
        {state === 'clocked-in' && (
          <button
            onClick={handleClockOut}
            className="flex-1 py-3 bg-red-500 text-white rounded-xl font-semibold text-sm hover:bg-red-600 transition-all flex items-center justify-center gap-2"
          >
            <Square size={16} /> Clock Out
          </button>
        )}
        
        {state === 'clocked-out' && (
          <div className="flex-1 py-3 bg-green-100 text-green-700 rounded-xl font-semibold text-sm flex items-center justify-center gap-2">
            <CheckCircle size={16} /> Shift Completed
          </div>
        )}
      </div>
      
      {/* Confirmation Toast */}
      <AnimatePresence>
        {showConfirmation && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="mt-3 p-2 bg-green-50 rounded-lg text-center"
          >
            <p className="text-xs text-green-700">
              {state === 'clocked-in' ? '✅ Clocked in successfully!' : 
               state === 'clocked-out' ? '✅ Shift completed! Hours recorded.' : ''}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}