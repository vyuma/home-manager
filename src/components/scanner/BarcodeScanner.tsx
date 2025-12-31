"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Html5Qrcode, Html5QrcodeSupportedFormats } from "html5-qrcode";
import { Camera, CameraOff, RefreshCw } from "lucide-react";

interface BarcodeScannerProps {
  onScan: (isbn: string) => void;
  onError?: (error: string) => void;
  continuous?: boolean;
  paused?: boolean;
}

export function BarcodeScanner({
  onScan,
  onError,
  continuous = false,
  paused = false,
}: BarcodeScannerProps) {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);
  const lastScannedRef = useRef<string | null>(null);
  const scanTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const stopScanner = useCallback(async () => {
    if (scannerRef.current) {
      try {
        const state = scannerRef.current.getState();
        if (state === 2) { // SCANNING state
          await scannerRef.current.stop();
        }
      } catch {
        // Ignore stop errors
      }
    }
    setIsScanning(false);
  }, []);

  const startScanner = useCallback(async () => {
    if (!scannerRef.current || paused) return;

    setError(null);

    try {
      // Check for camera permissions
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      stream.getTracks().forEach((track) => track.stop());
      setHasPermission(true);

      await scannerRef.current.start(
        { facingMode: "environment" },
        {
          fps: 10,
          qrbox: { width: 280, height: 160 },
          aspectRatio: 1.5,
        },
        (decodedText) => {
          // Validate ISBN format (EAN-13 starting with 978 or 979)
          const cleanedCode = decodedText.replace(/[-\s]/g, "");
          if (/^(978|979)\d{10}$/.test(cleanedCode)) {
            // Prevent duplicate scans in quick succession
            if (lastScannedRef.current === cleanedCode) {
              return;
            }

            lastScannedRef.current = cleanedCode;
            onScan(cleanedCode);

            // Reset last scanned after delay for continuous mode
            if (continuous) {
              if (scanTimeoutRef.current) {
                clearTimeout(scanTimeoutRef.current);
              }
              scanTimeoutRef.current = setTimeout(() => {
                lastScannedRef.current = null;
              }, 2000);
            }
          }
        },
        () => {
          // Ignore scan failures (no barcode in frame)
        }
      );

      setIsScanning(true);
    } catch (err) {
      console.error("Scanner start error:", err);
      if (err instanceof Error) {
        if (err.name === "NotAllowedError") {
          setHasPermission(false);
          setError("カメラへのアクセスが拒否されました");
          onError?.("カメラへのアクセスが拒否されました");
        } else {
          setError(err.message);
          onError?.(err.message);
        }
      }
    }
  }, [onScan, onError, continuous, paused]);

  useEffect(() => {
    const scannerId = "barcode-scanner";

    // Create scanner instance
    scannerRef.current = new Html5Qrcode(scannerId, {
      formatsToSupport: [Html5QrcodeSupportedFormats.EAN_13],
      verbose: false,
    });

    // Start scanning
    startScanner();

    // Cleanup
    return () => {
      if (scanTimeoutRef.current) {
        clearTimeout(scanTimeoutRef.current);
      }
      stopScanner();
    };
  }, [startScanner, stopScanner]);

  // Handle pause state
  useEffect(() => {
    if (paused && isScanning) {
      stopScanner();
    } else if (!paused && !isScanning && hasPermission) {
      startScanner();
    }
  }, [paused, isScanning, hasPermission, startScanner, stopScanner]);

  const handleRetry = () => {
    setError(null);
    setHasPermission(null);
    startScanner();
  };

  return (
    <div className="relative">
      {/* Scanner Container */}
      <div className="relative overflow-hidden rounded-2xl bg-black">
        <div
          id="barcode-scanner"
          className="w-full aspect-[4/3]"
        />

        {/* Scanning Overlay */}
        {isScanning && (
          <div className="absolute inset-0 pointer-events-none">
            {/* Corner markers */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="relative w-72 h-40">
                {/* Top-left corner */}
                <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-accent-cyan" />
                {/* Top-right corner */}
                <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-accent-cyan" />
                {/* Bottom-left corner */}
                <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-accent-cyan" />
                {/* Bottom-right corner */}
                <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-accent-cyan" />

                {/* Scan line animation */}
                <div className="absolute left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-accent-cyan to-transparent animate-scan" />
              </div>
            </div>

            {/* Status indicator */}
            <div className="absolute bottom-4 left-0 right-0 flex justify-center">
              <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-black/50 backdrop-blur-sm">
                <div className="w-2 h-2 rounded-full bg-accent-green animate-pulse" />
                <span className="text-sm text-white">
                  {continuous ? "連続スキャン中" : "スキャン中"}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Error/Permission State */}
        {hasPermission === false && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-bg-secondary/95">
            <CameraOff className="w-16 h-16 text-text-muted mb-4" />
            <p className="text-text-secondary text-center mb-4 px-4">
              カメラへのアクセスを許可してください
            </p>
            <button
              onClick={handleRetry}
              className="btn-primary flex items-center gap-2 py-2 px-4"
            >
              <RefreshCw className="w-4 h-4" />
              再試行
            </button>
          </div>
        )}

        {error && hasPermission !== false && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-bg-secondary/95">
            <Camera className="w-16 h-16 text-text-muted mb-4" />
            <p className="text-accent-pink text-center mb-4 px-4">{error}</p>
            <button
              onClick={handleRetry}
              className="btn-primary flex items-center gap-2 py-2 px-4"
            >
              <RefreshCw className="w-4 h-4" />
              再試行
            </button>
          </div>
        )}
      </div>

      {/* Instructions */}
      <p className="text-center text-text-secondary text-sm mt-4">
        本のバーコード（ISBN）を枠内に合わせてください
      </p>
    </div>
  );
}
