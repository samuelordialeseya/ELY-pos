/**
 * Detects whether the current runtime is iOS / iPadOS (including iPadOS 13+ requesting desktop site).
 */
function isIOSDevice() {
  if (typeof navigator === "undefined") return false;
  return (
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1) ||
    (Boolean(window.navigator?.userAgent?.includes("Macintosh")) &&
      "ontouchend" in document)
  );
}

/**
 * Exports an HTML canvas element to a downloadable PNG file or native mobile Share Sheet.
 * Handles iOS Safari limitations where synthetic anchor clicks fail on canvas blobs.
 */
export async function exportCanvasImage(canvas, filename, onSuccess, onError) {
  if (!canvas) {
    if (onError) onError("Canvas element not found");
    return;
  }

  const isIOS = isIOSDevice();

  if (isIOS) {
    try {
      const dataUrl = canvas.toDataURL("image/png");
      const arr = dataUrl.split(",");
      const mime = arr[0].match(/:(.*?);/)[1];
      const bstr = atob(arr[1]);
      let n = bstr.length;
      const u8arr = new Uint8Array(n);
      while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
      }
      const file = new File([u8arr], filename, { type: mime });

      // Native iOS Share Sheet: provides "Save Image" to Photos, "Save to Files", AirDrop, etc.
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        try {
          await navigator.share({
            files: [file],
            title: filename
          });
          if (onSuccess) onSuccess("Saved successfully");
          return;
        } catch (shareErr) {
          if (shareErr.name === "AbortError") {
            // User dismissed the iOS share sheet without selecting an action
            return;
          }
        }
      }

      // Fallback for iOS if Web Share failed or not available (e.g. non-HTTPS): open image in tab
      const blobUrl = URL.createObjectURL(file);
      const win = window.open(blobUrl, "_blank");
      if (!win) {
        window.location.href = blobUrl;
      }
      if (onSuccess) onSuccess("Touch & hold image to Save to Photos");
      return;
    } catch (iosErr) {
      console.error("iOS image export error:", iosErr);
      if (onError) onError(iosErr.message);
      return;
    }
  }

  // Direct browser download for PC (Windows / Mac Desktop / Linux) and Android
  try {
    const link = document.createElement("a");
    link.download = filename;
    link.href = canvas.toDataURL("image/png");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    if (onSuccess) onSuccess("Saved successfully");
  } catch (e) {
    console.error("Direct download error:", e);
    if (onError) onError("Download failed: " + e.message);
  }
}

/**
 * Dynamically imports html2canvas on demand and exports a DOM element by ID to PNG.
 * Uses adaptive resolution scaling (1.5x on iPad/iOS to protect 2GB RAM on iPad Air 2, 2x on desktop)
 * and immediately frees WebKit canvas memory after export.
 */
export async function captureElementToPng(
  elementId,
  filename,
  { hideSelector, onSuccess, onError } = {}
) {
  const element = document.getElementById(elementId);
  if (!element) {
    if (onError) onError("Target element not found");
    return;
  }

  const hiddenEl = hideSelector ? element.querySelector(hideSelector) : null;
  const prevDisplay = hiddenEl ? hiddenEl.style.display : "";
  if (hiddenEl) hiddenEl.style.display = "none";

  let canvas = null;
  try {
    const { default: html2canvas } = await import("html2canvas");
    const captureScale = isIOSDevice() ? 1.5 : 2;
    canvas = await html2canvas(element, {
      scale: captureScale,
      backgroundColor: "#ffffff",
      logging: false,
      useCORS: true,
      scrollY: 0,
      scrollX: 0,
      windowWidth: element.scrollWidth,
      windowHeight: element.scrollHeight,
      onclone: (clonedDoc) => {
        const clonedEl = clonedDoc.getElementById(elementId);
        if (clonedEl) {
          clonedEl.style.boxShadow = "none";
          clonedEl.style.margin = "0";
          clonedEl.style.height = "auto";
          clonedEl.style.maxHeight = "none";
          clonedEl.style.overflow = "visible";
          if (clonedEl.classList.contains("receipt-thermal-paper")) {
            clonedEl.style.width = "390px";
            clonedEl.style.maxWidth = "390px";
          }
        }
      }
    });
    await exportCanvasImage(canvas, filename, onSuccess, onError);
  } catch (err) {
    console.error("Capture error:", err);
    if (onError) onError(err.message || "Capture failed");
  } finally {
    if (hiddenEl) hiddenEl.style.display = prevDisplay || "flex";
    // Explicitly release WebKit canvas backing store memory on 2GB RAM iPads
    if (canvas) {
      canvas.width = 0;
      canvas.height = 0;
    }
  }
}
