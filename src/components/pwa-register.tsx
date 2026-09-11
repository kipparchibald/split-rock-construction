import { useEffect } from "react";
import { attachChunkLoadRecovery } from "@/lib/chunk-load-recovery";

/**
 * Registers the light offline shell service worker (production + preview)
 * and recovers from Vite chunk preload failures after deploys.
 */
export function PwaRegister() {
  useEffect(() => {
    if (typeof window === "undefined") return;

    const detachRecovery = attachChunkLoadRecovery(window);

    if (!("serviceWorker" in navigator)) {
      return () => {
        detachRecovery();
      };
    }
    // Skip in pure unit tests / playwright when disabled
    if (window.localStorage.getItem("src-disable-sw") === "1") {
      return () => {
        detachRecovery();
      };
    }

    const onLoad = () => {
      void navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch(() => {
        /* silent — SW is progressive enhancement */
      });
    };

    if (document.readyState === "complete") onLoad();
    else window.addEventListener("load", onLoad, { once: true });

    return () => {
      detachRecovery();
    };
  }, []);

  return null;
}
