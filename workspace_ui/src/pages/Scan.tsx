import { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { BrowserQRCodeReader } from '@zxing/browser';
import { QrCode, Loader2, AlertCircle, Camera, CameraOff } from 'lucide-react';

/** UUID as used in resource routes (with or without hyphens normalized by match length). */
const RESOURCE_ID_RE = /([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/i;

function parseResourceIdFromQrText(text: string): string | null {
  const t = text.trim();
  const inPath = t.match(new RegExp(`/resource/${RESOURCE_ID_RE.source}`, 'i'));
  if (inPath?.[1]) return inPath[1];
  const plain = t.match(new RegExp(`^${RESOURCE_ID_RE.source}$`, 'i'));
  if (plain?.[1]) return plain[1];
  try {
    const u = new URL(t);
    const fromUrl = u.pathname.match(new RegExp(`/resource/${RESOURCE_ID_RE.source}`, 'i'));
    if (fromUrl?.[1]) return fromUrl[1];
  } catch {
    /* not a URL */
  }
  return null;
}

function getCameraBlockedMessage(): string {
  if (typeof window !== 'undefined' && !window.isSecureContext) {
    return (
      'This page is not loaded over a secure context (HTTPS or http://localhost). ' +
      'Open the app at http://localhost:3000 for in-app scanning, or use your phone’s camera app to scan the resource QR—it will open the link in the browser.'
    );
  }
  return (
    "Could not access the camera. Check permissions, or use your phone's camera app to scan the QR code instead—it will open the resource in your browser."
  );
}

/**
 * Turn on the camera and point it at a resource QR code.
 * We read the link on the code and open that resource in the app.
 */
export const Scan = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const navigate = useNavigate();
  const [cameraOn, setCameraOn] = useState(false);
  const [status, setStatus] = useState<'idle' | 'loading' | 'scanning' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const scannerControlsRef = useRef<{ stop: () => void } | null>(null);

  const stopCamera = useCallback(() => {
    scannerControlsRef.current?.stop();
    scannerControlsRef.current = null;
    setStatus('idle');
    setCameraOn(false);
  }, []);

  useEffect(() => {
    if (!cameraOn) return;

    const video = videoRef.current;
    if (!video) return;

    setStatus('loading');
    const codeReader = new BrowserQRCodeReader();

    codeReader
      .decodeFromVideoDevice(undefined, video, (result, _err, ctrl) => {
        scannerControlsRef.current = ctrl;
        if (result) {
          const text = result.getText();
          const resourceId = parseResourceIdFromQrText(text);
          if (resourceId) {
            ctrl.stop();
            scannerControlsRef.current = null;
            navigate(`/resource/${resourceId}`, { replace: true });
          }
        }
      })
      .then((ctrl) => {
        scannerControlsRef.current = ctrl;
        setStatus('scanning');
      })
      .catch((err: Error) => {
        console.error('Camera error:', err);
        setStatus('error');
        setCameraOn(false);
        if (
          typeof window !== 'undefined' &&
          (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia)
        ) {
          setErrorMessage(getCameraBlockedMessage());
        } else {
          setErrorMessage(err.message || 'Could not access camera. Check permissions.');
        }
      });

    return () => {
      scannerControlsRef.current?.stop();
      scannerControlsRef.current = null;
    };
  }, [cameraOn, navigate]);

  const toggleCamera = () => {
    if (cameraOn) {
      stopCamera();
    } else {
      if (typeof window !== 'undefined' && (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia)) {
        setStatus('error');
        setErrorMessage(getCameraBlockedMessage());
        return;
      }
      setCameraOn(true);
      setErrorMessage('');
    }
  };

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <header className="text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-indigo-100 text-indigo-600 mb-4">
          <QrCode size={32} />
        </div>
        <h1 className="text-2xl font-bold text-slate-900">Scan QR Code</h1>
        <p className="text-slate-500 mt-2">
          {cameraOn
            ? 'Point your camera at a resource QR code to view details or check out.'
            : 'Tap the button below to turn on your camera and start scanning.'}
        </p>
      </header>

      <div className="aspect-square max-w-sm mx-auto bg-slate-900 rounded-2xl overflow-hidden relative">
        <video
          ref={videoRef}
          className="w-full h-full object-cover"
          muted
          playsInline
        />
        {!cameraOn && status === 'idle' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-800 text-white p-6">
            <div className="w-24 h-24 rounded-full bg-slate-700 flex items-center justify-center mb-4">
              <Camera size={40} className="text-slate-400" />
            </div>
            <p className="text-center font-medium">Camera off</p>
            <p className="text-sm text-slate-400 mt-2 text-center">
              Turn on the camera to scan a QR code
            </p>
          </div>
        )}
        {status === 'loading' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/90 text-white">
            <Loader2 className="animate-spin mb-4" size={48} />
            <p>Starting camera...</p>
          </div>
        )}
        {status === 'error' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/90 text-white p-6">
            <AlertCircle size={48} className="text-rose-400 mb-4" />
            <p className="text-center font-medium">Camera unavailable</p>
            <p className="text-sm text-slate-300 mt-2 text-center">{errorMessage}</p>
          </div>
        )}
        {status === 'scanning' && (
          <div className="absolute inset-4 border-2 border-indigo-500/50 rounded-xl pointer-events-none" />
        )}
      </div>

      <div className="flex justify-center">
        <button
          type="button"
          onClick={toggleCamera}
          className={`
            inline-flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-colors
            ${cameraOn
              ? 'bg-rose-600 hover:bg-rose-700 text-white'
              : 'bg-indigo-600 hover:bg-indigo-700 text-white'}
          `}
        >
          {cameraOn ? (
            <>
              <CameraOff size={20} />
              Turn off camera
            </>
          ) : (
            <>
              <Camera size={20} />
              Turn on camera
            </>
          )}
        </button>
      </div>
    </div>
  );
};
