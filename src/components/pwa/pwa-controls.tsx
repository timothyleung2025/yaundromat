"use client";
import { useEffect, useState } from "react";
import { RefreshCw, WifiOff } from "lucide-react";

export function PwaControls() {
  const [offline, setOffline] = useState(false);
  const [waiting, setWaiting] = useState<ServiceWorker | null>(null);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    const checkConnection = () => setOffline(!navigator.onLine);
    checkConnection();
    window.addEventListener("online", checkConnection);
    window.addEventListener("offline", checkConnection);
    return () => {
      window.removeEventListener("online", checkConnection);
      window.removeEventListener("offline", checkConnection);
    };
  }, []);

  useEffect(() => {
    if (!("serviceWorker" in navigator) || !window.isSecureContext) return;
    let disposed = false;
    let registration: ServiceWorkerRegistration | undefined;
    let installing: ServiceWorker | null = null;
    let hadController = Boolean(navigator.serviceWorker.controller);
    let reloading = false;
    function controllerChanged() {
      if (disposed) return;
      if (hadController && !reloading) {
        reloading = true;
        window.location.reload();
      }
      hadController = true;
    }
    function inspectWorker() {
      if (disposed || !registration) return;
      if (registration.waiting && navigator.serviceWorker.controller)
        setWaiting(registration.waiting);
    }
    function updateFound() {
      installing?.removeEventListener("statechange", inspectWorker);
      installing = registration?.installing ?? null;
      installing?.addEventListener("statechange", inspectWorker);
      inspectWorker();
    }
    async function register() {
      try {
        if (process.env.NODE_ENV !== "production") {
          // Production caches must not hide changes when the same origin runs next dev.
          const existing = await navigator.serviceWorker.getRegistration("/");
          const worker = existing?.active ?? existing?.waiting;
          if (worker && new URL(worker.scriptURL).pathname === "/sw.js") {
            await existing?.unregister();
            const keys = await caches.keys();
            await Promise.all(
              keys
                .filter((key) => key.startsWith("yaundromat-pwa-"))
                .map((key) => caches.delete(key)),
            );
          }
          return;
        }
        const result = await navigator.serviceWorker.register("/sw.js", {
          scope: "/",
          updateViaCache: "none",
        });
        if (disposed) return;
        registration = result;
        registration.addEventListener("updatefound", updateFound);
        updateFound();
      } catch {
        // Installation and offline storage are enhancements; the online app stays usable.
      }
    }
    function checkUpdate() {
      if (document.visibilityState === "visible" && navigator.onLine) {
        if (registration) void registration.update().catch(() => {});
        else void register();
      }
    }
    navigator.serviceWorker.addEventListener(
      "controllerchange",
      controllerChanged,
    );
    document.addEventListener("visibilitychange", checkUpdate);
    window.addEventListener("online", checkUpdate);
    void register();
    return () => {
      disposed = true;
      navigator.serviceWorker.removeEventListener(
        "controllerchange",
        controllerChanged,
      );
      document.removeEventListener("visibilitychange", checkUpdate);
      window.removeEventListener("online", checkUpdate);
      registration?.removeEventListener("updatefound", updateFound);
      installing?.removeEventListener("statechange", inspectWorker);
    };
  }, []);

  return (
    <>
      {offline && (
        <div className="pwa-offline" role="status">
          <WifiOff size={14} />
          Offline · your saved loads are on this device
        </div>
      )}
      <div className="pwa-tools">
        {waiting && (
          <div className="pwa-update" role="status">
            <span>A new version is ready.</span>
            <button
              disabled={updating}
              onClick={() => {
                setUpdating(true);
                waiting.postMessage({ type: "ACTIVATE_UPDATE" });
              }}
            >
              <RefreshCw size={15} />
              {updating ? "Updating…" : "Update app"}
            </button>
          </div>
        )}
      </div>
    </>
  );
}
