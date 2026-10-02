/**
 * Exports an HTML canvas element to a downloadable PNG file or native mobile Share Sheet.
 * Handles iOS Safari limitations where synthetic anchor clicks fail on canvas blobs.
 */
export async function exportCanvasImage(canvas, filename, onSuccess, onError) {
  if (!canvas) {
    if (onError) onError("Canvas element not found");
    return;
  }

  // Detect iOS / iPadOS
  const isIOS = 
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1) ||
    (Boolean(window.navigator?.userAgent?.includes("Macintosh")) && "ontouchend" in document);

  if (isIOS) {
    try {
      const dataUrl = canvas.toDataURL("image/png");
      const arr = dataUrl.split(',');
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
            title: filename,
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
