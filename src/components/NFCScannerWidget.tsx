import React, { useState, useEffect, useRef } from 'react';
import { Usb, AlertCircle, CheckCircle2, Loader2, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface NFCScannerWidgetProps {
  onScan: (uid: string) => void;
  className?: string;
}

export default function NFCScannerWidget({ onScan, className = '' }: NFCScannerWidgetProps) {
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  
  const portRef = useRef<any>(null);
  const readerRef = useRef<any>(null);
  const keepReadingRef = useRef(true);

  // Buffer to build the serial line until a newline is found
  const bufferRef = useRef('');

  useEffect(() => {
    return () => {
      keepReadingRef.current = false;
      disconnect();
    };
  }, []);

  const connect = async () => {
    setError(null);
    if (!('serial' in navigator)) {
      setError('Web Serial API is not supported in this browser. Please use Chrome or Edge.');
      return;
    }

    try {
      setIsConnecting(true);
      // Prompt user to select a port
      const port = await (navigator as any).serial.requestPort();
      await port.open({ baudRate: 115200 }); // Match the baudRate in main.cpp
      
      portRef.current = port;
      setIsConnected(true);
      keepReadingRef.current = true;
      
      readLoop(port);
    } catch (err: any) {
      console.error('Serial connect error:', err);
      // Only show error if they didn't just cancel the prompt
      if (!err.message?.includes('No port selected')) {
        setError('Failed to connect to scanner. ' + err.message);
      }
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnect = async () => {
    keepReadingRef.current = false;
    
    if (readerRef.current) {
      try {
        await readerRef.current.cancel();
      } catch (err) {
        console.error(err);
      }
    }
    
    if (portRef.current) {
      try {
        await portRef.current.close();
      } catch (err) {
        console.error(err);
      }
      portRef.current = null;
    }
    setIsConnected(false);
  };

  const readLoop = async (port: any) => {
    while (port.readable && keepReadingRef.current) {
      readerRef.current = port.readable.getReader();
      try {
        while (true) {
          const { value, done } = await readerRef.current.read();
          if (done) break;
          
          if (value) {
            // Convert Uint8Array to string
            const chunk = new TextDecoder().decode(value);
            bufferRef.current += chunk;
            
            // Check if we have complete lines
            const lines = bufferRef.current.split('\n');
            // Keep the last partial line in the buffer
            bufferRef.current = lines.pop() || '';
            
            for (const line of lines) {
              const cleanLine = line.trim();
              if (cleanLine.startsWith('UID:')) {
                // Parse the UID from "UID:  0x04 0xA1 ..."
                const parts = cleanLine.substring(4).trim().split(' ');
                // Clean up into a single hex string, e.g. "04A1B2C3"
                const hexUID = parts
                  .map(p => p.replace('0x', '').trim())
                  .filter(p => p.length > 0)
                  .map(p => p.padStart(2, '0'))
                  .join('')
                  .toUpperCase();
                  
                if (hexUID) {
                  onScan(hexUID);
                }
              }
            }
          }
        }
      } catch (error) {
        console.error('Serial read error:', error);
        setError('Lost connection to scanner.');
        setIsConnected(false);
      } finally {
        readerRef.current.releaseLock();
      }
    }
  };

  return (
    <div className={`bg-surface-container rounded-2xl p-4 flex items-center justify-between shadow-sm border border-outline-variant ${className}`}>
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isConnected ? 'bg-green-100 text-green-700' : 'bg-surface-container-highest text-on-surface-variant'}`}>
          <Usb size={20} />
        </div>
        <div>
          <h4 className="font-bold text-sm text-on-surface">IoT NFC Scanner</h4>
          <p className="text-xs font-medium text-on-surface-variant">
            {isConnected ? (
              <span className="flex items-center gap-1 text-green-600"><CheckCircle2 size={12} /> Connected & Listening</span>
            ) : (
              'Connect via USB to scan cards'
            )}
          </p>
        </div>
      </div>
      
      <div className="flex items-center gap-2">
        {error && (
          <div className="text-[10px] text-error flex items-center gap-1 bg-error-container/30 px-2 py-1 rounded">
            <AlertCircle size={10} /> {error}
          </div>
        )}
        
        {isConnected ? (
          <button 
            onClick={disconnect}
            className="px-4 py-2 rounded-lg bg-surface-container-highest text-on-surface-variant hover:text-error text-xs font-bold transition-colors flex items-center gap-1"
          >
            <X size={14} /> Disconnect
          </button>
        ) : (
          <button 
            onClick={connect}
            disabled={isConnecting}
            className="px-4 py-2 rounded-lg bg-primary text-white text-xs font-bold hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center gap-1 shadow-sm"
          >
            {isConnecting && <Loader2 size={12} className="animate-spin" />}
            Connect Scanner
          </button>
        )}
      </div>
    </div>
  );
}
