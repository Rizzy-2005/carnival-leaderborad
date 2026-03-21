import { useEffect, useRef, useState, useCallback } from 'react'
import { Html5Qrcode } from 'html5-qrcode'

/* ─────────────────────────────────────────────────────────────
   GLOBAL STYLE INJECTION
   html5-qrcode injects inline styles but we need to override
   the video element to fill our container properly.
───────────────────────────────────────────────────────────── */
const injectGlobalStyles = () => {
  if (document.getElementById("qr-global-style")) return;
  const style = document.createElement("style");
  style.id = "qr-global-style";
  style.textContent = `
    #carnival-qr-reader {
      width: 100% !important;
      min-height: 280px;
    }
    #carnival-qr-reader video {
      width: 100% !important;
      height: 100% !important;
      object-fit: cover !important;
      border-radius: 16px !important;
    }
    #carnival-qr-reader img {
      display: none !important;
    }
    #carnival-qr-reader > div {
      border: none !important;
      box-shadow: none !important;
    }
  `;
  document.head.appendChild(style);
};

export default function QRScanner({ onScan, tracking }) {
  const scannerRef = useRef(null)
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    injectGlobalStyles()

    if (!tracking) {
      if (scannerRef.current) {
        scannerRef.current.stop().catch(() => {})
        scannerRef.current = null
      }
      return
    }

    let isUnmounted = false

    const startScanner = async () => {
      // Small delay to ensure the DOM element #carnival-qr-reader is fully rendered with dimensions
      await new Promise(resolve => setTimeout(resolve, 60))
      
      if (isUnmounted) return

      try {
        setErrorMsg('Starting camera...')
        
        const qr = new Html5Qrcode("carnival-qr-reader", { verbose: false })
        scannerRef.current = qr

        await qr.start(
          { facingMode: "environment" },
          {
            fps: 15,
            qrbox: { width: 250, height: 250 },
            aspectRatio: 1.0,
            disableFlip: false,
          },
          (decodedText) => {
            if (isUnmounted) return
            // Stop scanning on success to prevent multiple rapid scans
            if (scannerRef.current) {
              scannerRef.current.pause?.()
              scannerRef.current.stop().catch(() => {})
              scannerRef.current = null
            }
            onScan(decodedText)
          },
          () => {} // ignore per-frame errors
        )

        if (!isUnmounted) {
          setErrorMsg('')
        }

      } catch (err) {
        console.error("Starting scanner failed:", err)
        if (!isUnmounted) {
          const msg = /[Pp]ermission/.test(err?.message)
            ? "Camera permission denied."
            : /[Nn]o camera/.test(err?.message)
            ? "No camera found on this device."
            : `Could not start: ${err?.message ?? String(err)}`
          setErrorMsg(msg)
          scannerRef.current = null
        }
      }
    }

    startScanner()

    return () => {
      isUnmounted = true
      if (scannerRef.current) {
        scannerRef.current.stop().catch(() => {})
        scannerRef.current = null
      }
    }
  }, [tracking, onScan])

  return (
    <div className="w-full flex flex-col items-center mt-6">
      <div
        style={{
          width: "280px",
          height: "280px",
          position: "relative",
          borderRadius: "16px",
          overflow: "hidden",
          border: "2px solid var(--primary-base)",
          background: "#000", /* pure black while loading */
        }}
      >
        <div id="carnival-qr-reader" style={{ width: "100%" }} />

        {/* Scan frame overlay */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            pointerEvents: "none",
            zIndex: 3
          }}
        >
          <div
            style={{
              width: "220px",
              height: "220px",
              border: "2.5px solid var(--primary-base)",
              borderRadius: "14px",
              boxShadow: "0 0 0 9999px rgba(0,0,0,0.45)",
            }}
          />
        </div>
      </div>
      
      {errorMsg && (
        <div className="mt-4 p-3 bg-red-100/10 border border-red-500/50 rounded-lg max-w-sm text-center">
          <p className="text-red-400 text-sm font-medium">Scanner Status:</p>
          <p className="text-red-300 text-xs mt-1 break-words">{errorMsg}</p>
        </div>
      )}
    </div>
  )
}
