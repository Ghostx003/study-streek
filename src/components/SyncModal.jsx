import { useState, useEffect, useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Html5Qrcode } from 'html5-qrcode';
import {
  X,
  Smartphone,
  Laptop,
  CheckCircle2,
  RefreshCw,
  Camera,
  AlertCircle,
  Copy,
  Check
} from 'lucide-react';
import { detectIsMobile } from '../utils/deviceDetector';

export function SyncModal({
  currentState,
  syncId,
  onSyncComplete,
  onClose
}) {
  const isMobileInitial = detectIsMobile();
  const [mode, setMode] = useState(isMobileInitial ? 'scan' : 'generate'); // 'generate' (desktop) | 'scan' (mobile)

  // Desktop generate state
  const [pairingData, setPairingData] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [genError, setGenError] = useState('');
  const [isPairedSuccess, setIsPairedSuccess] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  // Mobile scan state
  const [scanError, setScanError] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [manualCode, setManualCode] = useState('');
  const [isCameraActive, setIsCameraActive] = useState(false);
  const scannerRef = useRef(null);
  const pollingRef = useRef(null);

  // 1. Desktop: Create pairing session
  const createPairingSession = async () => {
    setIsGenerating(true);
    setGenError('');
    try {
      const res = await fetch('/api/pair/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          desktopState: currentState,
          syncId: syncId || undefined,
          clientOrigin: typeof window !== 'undefined' ? window.location.origin : undefined
        })
      });

      if (!res.ok) throw new Error('Failed to create pairing session');
      const data = await res.json();
      setPairingData(data);

      // Start polling for mobile connection
      startPolling(data.token);
    } catch (err) {
      setGenError(err.message || 'Unable to initialize device pairing.');
    } finally {
      setIsGenerating(false);
    }
  };

  // Poll for pairing completion on desktop
  const startPolling = (token) => {
    if (pollingRef.current) clearInterval(pollingRef.current);

    pollingRef.current = setInterval(async () => {
      try {
        const res = await fetch(`/api/pair/poll?token=${token}`);
        if (res.ok) {
          const data = await res.json();
          if (data.status === 'paired') {
            clearInterval(pollingRef.current);
            setIsPairedSuccess(true);
            if (data.state) {
              onSyncComplete(data.syncId, data.state);
            }
          }
        }
      } catch {
        // network retry
      }
    }, 2000);
  };

  useEffect(() => {
    if (mode === 'generate') {
      createPairingSession();
    }
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [mode]);

  // 2. Mobile: Start Camera Scanner
  useEffect(() => {
    if (mode === 'scan') {
      const qrBoxId = 'qr-reader-container';
      let html5QrCode = null;

      const timer = setTimeout(() => {
        try {
          html5QrCode = new Html5Qrcode(qrBoxId);
          scannerRef.current = html5QrCode;

          html5QrCode.start(
            { facingMode: 'environment' },
            {
              fps: 10,
              qrbox: { width: 220, height: 220 }
            },
            (decodedText) => {
              handleDecodedQr(decodedText);
            },
            () => {
              // frame parse error ignore
            }
          ).then(() => {
            setIsCameraActive(true);
            setScanError('');
          }).catch((err) => {
            console.warn('Camera start error:', err);
            setIsCameraActive(false);
            setScanError('Camera unavailable or permission denied. You can enter the 6-digit code manually below.');
          });
        } catch (e) {
          setIsCameraActive(false);
          setScanError('Unable to start camera.');
        }
      }, 300);

      return () => {
        clearTimeout(timer);
        if (scannerRef.current) {
          try {
            scannerRef.current.stop().then(() => {
              scannerRef.current.clear();
            }).catch(() => {});
          } catch {
            // ignore cleanup errors
          }
        }
      };
    }
  }, [mode]);

  // Process decoded QR text
  const handleDecodedQr = async (text) => {
    if (isProcessing) return;

    let token = null;
    let code = null;

    try {
      if (text.includes('pairToken=')) {
        const url = new URL(text);
        token = url.searchParams.get('pairToken');
        code = url.searchParams.get('code');
      } else if (text.startsWith('{')) {
        const parsed = JSON.parse(text);
        token = parsed.token || parsed.pairToken;
        code = parsed.code;
      } else if (text.length === 6) {
        code = text;
      }
    } catch {
      token = text;
    }

    if (!token && !code) {
      setScanError('Unrecognized QR code format.');
      return;
    }

    await claimPairing({ token, code });
  };

  // Claim pairing with backend
  const claimPairing = async ({ token, code }) => {
    setIsProcessing(true);
    setScanError('');

    // Stop scanner if active
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
      } catch {
        // ignore
      }
    }

    try {
      const res = await fetch('/api/pair/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          code,
          mobileState: currentState
        })
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Pairing failed. Code may have expired.');
      }

      const data = await res.json();
      setIsPairedSuccess(true);
      if (data.state) {
        onSyncComplete(data.syncId, data.state);
      }
    } catch (err) {
      setScanError(err.message || 'Failed to connect. Please check the code.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleManualCodeSubmit = (e) => {
    e.preventDefault();
    if (!manualCode || manualCode.trim().length !== 6) {
      setScanError('Please enter a valid 6-digit pairing code.');
      return;
    }
    claimPairing({ code: manualCode.trim() });
  };

  const handleCopyCode = () => {
    if (pairingData?.code) {
      navigator.clipboard.writeText(pairingData.code);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card sync-modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="sync-modal-title-group">
            <h3 className="modal-title">Device Synchronization</h3>
            <span className="sync-modal-subtitle">
              {mode === 'generate' ? 'Desktop / Host Screen' : 'Mobile Scanner'}
            </span>
          </div>
          <button type="button" className="btn-icon-close" onClick={onClose} aria-label="Close">
            <X className="icon-sm" />
          </button>
        </div>

        {/* Mode Toggle Tabs */}
        <div className="sync-mode-tabs">
          <button
            type="button"
            className={`sync-tab-btn ${mode === 'generate' ? 'active' : ''}`}
            onClick={() => {
              setMode('generate');
              setIsPairedSuccess(false);
            }}
          >
            <Laptop className="icon-xs" />
            <span>Show QR Code</span>
          </button>
          <button
            type="button"
            className={`sync-tab-btn ${mode === 'scan' ? 'active' : ''}`}
            onClick={() => {
              setMode('scan');
              setIsPairedSuccess(false);
            }}
          >
            <Smartphone className="icon-xs" />
            <span>Scan QR Code</span>
          </button>
        </div>

        <div className="sync-modal-body">
          {/* SUCCESS STATE */}
          {isPairedSuccess ? (
            <div className="sync-success-view">
              <CheckCircle2 className="icon-xl text-success animate-bounce" />
              <h4 className="sync-success-title">Devices Synchronized</h4>
              <p className="sync-success-desc">
                Your study progress has been synchronized across devices using the latest updates.
              </p>
              <button
                type="button"
                className="btn-primary btn-block mt-4"
                onClick={onClose}
              >
                Done
              </button>
            </div>
          ) : mode === 'generate' ? (
            /* DESKTOP GENERATE QR VIEW */
            <div className="sync-generate-view">
              {isGenerating ? (
                <div className="sync-loading-spinner">
                  <RefreshCw className="icon-md animate-spin text-accent" />
                  <span>Generating pairing token...</span>
                </div>
              ) : genError ? (
                <div className="sync-error-banner">
                  <AlertCircle className="icon-sm" />
                  <span>{genError}</span>
                  <button type="button" className="btn-secondary btn-sm mt-2" onClick={createPairingSession}>
                    Retry
                  </button>
                </div>
              ) : pairingData ? (
                <div className="sync-qr-display">
                  <div className="qr-box">
                    <QRCodeSVG
                      value={pairingData.qrUrl}
                      size={200}
                      level="M"
                      includeMargin={true}
                    />
                  </div>

                  <div className="sync-code-section mt-3">
                    <span className="sync-code-label">Pairing Code</span>
                    <div className="sync-code-badge" onClick={handleCopyCode}>
                      <span className="code-text">{pairingData.code}</span>
                      <button type="button" className="btn-icon-copy" title="Copy code">
                        {copiedCode ? <Check className="icon-xs text-success" /> : <Copy className="icon-xs" />}
                      </button>
                    </div>
                  </div>

                  <div className="sync-listener-status mt-3">
                    <RefreshCw className="icon-xs animate-spin text-muted" />
                    <span>Waiting for mobile device to connect...</span>
                  </div>
                </div>
              ) : null}
            </div>
          ) : (
            /* MOBILE SCANNER VIEW */
            <div className="sync-scan-view">
              <div className="scanner-viewport-wrapper">
                <div id="qr-reader-container" className="qr-reader-box" />
                {isProcessing && (
                  <div className="scanner-overlay-processing">
                    <RefreshCw className="icon-md animate-spin text-accent" />
                    <span>Connecting and synchronizing...</span>
                  </div>
                )}
              </div>

              {scanError && (
                <div className="sync-error-banner mt-2">
                  <AlertCircle className="icon-xs" />
                  <span>{scanError}</span>
                </div>
              )}

              {/* Manual 6-Digit Code Fallback */}
              <form onSubmit={handleManualCodeSubmit} className="manual-code-form mt-4">
                <label className="form-label text-center" htmlFor="manual-code-input">
                  Or enter the 6-digit code
                </label>
                <div className="input-group">
                  <input
                    id="manual-code-input"
                    type="text"
                    maxLength={6}
                    pattern="[0-9]{6}"
                    className="input-text text-center font-mono font-bold"
                    placeholder="e.g. 583921"
                    value={manualCode}
                    onChange={(e) => {
                      setManualCode(e.target.value);
                      setScanError('');
                    }}
                  />
                  <button
                    type="submit"
                    className="btn-primary"
                    disabled={isProcessing || manualCode.trim().length !== 6}
                  >
                    Connect
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
