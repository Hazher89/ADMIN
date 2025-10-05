'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Camera, X, AlertCircle, CheckCircle, Flashlight, FlashlightOff, RotateCw, Hash } from 'lucide-react';

interface BarcodeScannerProps {
  onScan: (code: string) => void;
  onClose: () => void;
  isOpen: boolean;
  className?: string;
}

// Simple barcode detection simulation
const simulateBarcodeDetection = (): string => {
  const codes = [
    'PROD-001-ABC123',
    'PROD-002-DEF456',
    'PROD-003-GHI789',
    'PROD-004-JKL012',
    'PROD-005-MNO345',
    'ITEM-001-XYZ789',
    'PACK-001-UVW456',
    'BOX-001-RST123'
  ];
  return codes[Math.floor(Math.random() * codes.length)];
};

export default function BarcodeScanner({ onScan, onClose, isOpen, className = '' }: BarcodeScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scanIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  const [isScanning, setIsScanning] = useState(false);
  const [cameraPermission, setCameraPermission] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [flashlightOn, setFlashlightOn] = useState(false);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [lastScannedCode, setLastScannedCode] = useState<string | null>(null);
  const [scannedCodes, setScannedCodes] = useState<string[]>([]);

  // Initialize camera when component mounts
  useEffect(() => {
    if (isOpen && !cameraPermission) {
      initializeCamera();
    }
    
    return () => {
      stopCamera();
    };
  }, [isOpen, facingMode]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCamera();
      if (scanIntervalRef.current) {
        clearInterval(scanIntervalRef.current);
      }
    };
  }, []);

  const initializeCamera = async () => {
    try {
      setError(null);
      
      // Request camera permission
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: facingMode,
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });

      streamRef.current = stream;
      setCameraPermission(true);

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setIsScanning(true);
        
        // Start scanning simulation
        startScanningSimulation();
      }

    } catch (error: any) {
      console.error('Camera initialization error:', error);
      setCameraPermission(false);
      
      if (error.name === 'NotAllowedError') {
        setError('Kamera-tilgang ble avvist. Vennligst tillat kamera-tilgang i nettleserinnstillingene.');
      } else if (error.name === 'NotFoundError') {
        setError('Ingen kamera funnet på enheten.');
      } else if (error.name === 'NotReadableError') {
        setError('Kamera er allerede i bruk av en annen applikasjon.');
      } else {
        setError('Kunne ikke initialisere kamera. Prøv igjen.');
      }
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => {
        track.stop();
      });
      streamRef.current = null;
    }
    
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }
    
    setIsScanning(false);
  };

  const startScanningSimulation = () => {
    // Simulate barcode scanning every 2-3 seconds
    const scanSimulation = () => {
      if (isScanning && Math.random() > 0.7) { // 30% chance of detecting a code
        const code = simulateBarcodeDetection();
        handleBarcodeDetected(code);
      }
    };

    scanIntervalRef.current = setInterval(scanSimulation, 2000);
  };

  const handleBarcodeDetected = useCallback((code: string) => {
    // Prevent duplicate scans
    if (scannedCodes.includes(code)) {
      return;
    }

    setLastScannedCode(code);
    setScannedCodes(prev => [...prev, code]);
    
    // Vibrate if supported
    if ('vibrate' in navigator) {
      navigator.vibrate(200);
    }
    
    // Play sound if needed (optional)
    // const audio = new Audio('/sounds/scan-success.mp3');
    // audio.play().catch(() => {});
    
    onScan(code);
  }, [onScan, scannedCodes]);

  const toggleFlashlight = () => {
    if (streamRef.current) {
      const videoTrack = streamRef.current.getVideoTracks()[0];
      if (videoTrack && 'applyConstraints' in videoTrack) {
        const constraints = {
          advanced: [{ torch: !flashlightOn } as any]
        };
        
        videoTrack.applyConstraints(constraints).then(() => {
          setFlashlightOn(!flashlightOn);
        }).catch((error) => {
          console.log('Flashlight not supported:', error);
          setError('Flashlight ikke støttet på denne enheten');
        });
      }
    }
  };

  const switchCamera = async () => {
    setFacingMode(prev => prev === 'environment' ? 'user' : 'environment');
  };

  const retryCamera = () => {
    stopCamera();
    setError(null);
    initializeCamera();
  };

  const clearScannedCodes = () => {
    setScannedCodes([]);
    setLastScannedCode(null);
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className={`fixed inset-0 z-50 bg-black ${className}`}>
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-10 bg-gradient-to-b from-black/70 to-transparent p-4">
        <div className="flex items-center justify-between">
          <button
            onClick={onClose}
            className="p-2 bg-black/50 rounded-full text-white hover:bg-black/70 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
          
          <h2 className="text-white font-semibold text-lg">
            Skann Strekkode
          </h2>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={clearScannedCodes}
              className="p-2 bg-black/50 rounded-full text-white hover:bg-black/70 transition-colors"
              title="Tøm skannede koder"
            >
              <Hash className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Camera View */}
      <div className="relative w-full h-full">
        {cameraPermission === true && (
          <div className="relative w-full h-full">
            <video
              ref={videoRef}
              className="w-full h-full object-cover"
              playsInline
              muted
            />
            
            {/* Scanning Overlay */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="relative">
                {/* Scanning Frame */}
                <div className="w-64 h-48 border-2 border-white rounded-lg relative">
                  {/* Corner indicators */}
                  <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-green-400 rounded-tl-lg"></div>
                  <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-green-400 rounded-tr-lg"></div>
                  <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-green-400 rounded-bl-lg"></div>
                  <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-green-400 rounded-br-lg"></div>
                  
                  {/* Scanning line animation */}
                  <div className="absolute inset-0 overflow-hidden rounded-lg">
                    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-green-400 to-transparent animate-pulse"></div>
                  </div>
                </div>
                
                {/* Instructions */}
                <div className="mt-8 text-center">
                  <p className="text-white text-lg font-medium mb-2">
                    Hold strekkoden innenfor rammen
                  </p>
                  <p className="text-gray-300 text-sm">
                    Koden vil bli skannet automatisk
                  </p>
                </div>
              </div>
            </div>

            {/* Success indicator for last scan */}
            {lastScannedCode && (
              <div className="absolute top-20 left-1/2 transform -translate-x-1/2 bg-green-500 text-white px-4 py-2 rounded-lg flex items-center space-x-2 animate-bounce">
                <CheckCircle className="w-5 h-5" />
                <span className="font-medium">{lastScannedCode}</span>
              </div>
            )}
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-black">
            <div className="text-center text-white p-8">
              <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Kamera Feil</h3>
              <p className="text-gray-300 mb-6 max-w-md">{error}</p>
              <button
                onClick={retryCamera}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Prøv Igjen
              </button>
            </div>
          </div>
        )}

        {/* Loading State */}
        {cameraPermission === null && (
          <div className="absolute inset-0 flex items-center justify-center bg-black">
            <div className="text-center text-white">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
              <p className="text-lg">Initialiserer kamera...</p>
            </div>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="absolute bottom-0 left-0 right-0 z-10 bg-gradient-to-t from-black/70 to-transparent p-6">
        <div className="flex items-center justify-center space-x-6">
          {/* Flashlight Toggle */}
          <button
            onClick={toggleFlashlight}
            className="p-4 bg-black/50 rounded-full text-white hover:bg-black/70 transition-colors"
            title={flashlightOn ? "Slå av lommelykt" : "Slå på lommelykt"}
          >
            {flashlightOn ? (
              <FlashlightOff className="w-6 h-6" />
            ) : (
              <Flashlight className="w-6 h-6" />
            )}
          </button>

          {/* Camera Switch */}
          <button
            onClick={switchCamera}
            className="p-4 bg-black/50 rounded-full text-white hover:bg-black/70 transition-colors"
            title="Bytt kamera"
          >
            <RotateCw className="w-6 h-6" />
          </button>
        </div>

        {/* Scanned Codes List */}
        {scannedCodes.length > 0 && (
          <div className="mt-6 max-h-32 overflow-y-auto">
            <div className="bg-black/50 rounded-lg p-4">
              <h4 className="text-white font-medium mb-2">
                Skannede koder ({scannedCodes.length})
              </h4>
              <div className="space-y-1">
                {scannedCodes.slice(-5).map((code, index) => (
                  <div key={index} className="flex items-center justify-between bg-green-500/20 text-green-300 px-3 py-1 rounded text-sm">
                    <span>{code}</span>
                    <CheckCircle className="w-4 h-4" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Hidden canvas for barcode processing */}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}
