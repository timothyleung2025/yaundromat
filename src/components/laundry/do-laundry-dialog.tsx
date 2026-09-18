"use client";
import { useEffect, useRef, useState } from "react";
import { ArrowRight, QrCode } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { GlassDialog } from "@/components/ui/glass-dialog";
import { resolveMachineCode } from "@/lib/silliman";
export type BrowseKind = "all" | "washer" | "dryer";
export type BrowsePreset = "all" | "available" | "soonest" | "next";
export function DoLaundryDialog({
  onClose,
  onSelect,
  onBrowse,
}: {
  onClose: () => void;
  onSelect: (id: string) => void;
  onBrowse: (kind: BrowseKind) => void;
}) {
  const [step, setStep] = useState<"start" | "kind">("start");
  const reducedMotion = useReducedMotion();
  const kindHeading = useRef<HTMLHeadingElement>(null);
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [scanning, setScanning] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  const video = useRef<HTMLVideoElement>(null);
  const selected = useRef(onSelect);
  selected.current = onSelect;
  useEffect(() => {
    if (!scanning) return;
    let cancelled = false;
    let stream: MediaStream | undefined;
    let timer: ReturnType<typeof setTimeout> | undefined;
    async function startCamera() {
      try {
        if (!navigator.mediaDevices?.getUserMedia)
          throw new Error("unsupported");
        const { default: jsQR } = await import("jsqr");
        if (cancelled) return;
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: "environment" } },
          audio: false,
        });
        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }
        const element = video.current;
        if (!element) return;
        element.srcObject = stream;
        await element.play();
        if (cancelled) return;
        setCameraReady(true);
        const canvas = document.createElement("canvas");
        const context = canvas.getContext("2d", { willReadFrequently: true });
        if (!context) throw new Error("canvas");
        const scan = () => {
          if (cancelled) return;
          if (element.readyState >= 2 && element.videoWidth) {
            canvas.width = Math.min(element.videoWidth, 640);
            canvas.height = Math.round(
              (element.videoHeight * canvas.width) / element.videoWidth,
            );
            context.drawImage(element, 0, 0, canvas.width, canvas.height);
            const frame = context.getImageData(
              0,
              0,
              canvas.width,
              canvas.height,
            );
            const result = jsQR(frame.data, frame.width, frame.height);
            if (result) {
              const id = resolveMachineCode(result.data);
              if (id) {
                stream?.getTracks().forEach((track) => track.stop());
                selected.current(id);
                return;
              }
              setError(
                "That code isn’t a Silliman machine. Try W01–W10 or D01–D04.",
              );
            }
          }
          timer = setTimeout(scan, 180);
        };
        scan();
      } catch {
        stream?.getTracks().forEach((track) => track.stop());
        if (!cancelled) {
          setError(
            "Camera unavailable. Allow camera access on HTTPS or enter the machine number below.",
          );
          setScanning(false);
          setCameraReady(false);
        }
      }
    }
    void startCamera();
    return () => {
      cancelled = true;
      clearTimeout(timer);
      stream?.getTracks().forEach((track) => track.stop());
    };
  }, [scanning]);
  return (
    <GlassDialog
      titleId="do-laundry-title"
      onClose={onClose}
      className="do-laundry-dialog"
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={step}
          initial={{ opacity: 0, y: reducedMotion ? 0 : 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: reducedMotion ? 0 : -6 }}
          transition={{ duration: reducedMotion ? 0 : 0.18 }}
          onAnimationComplete={() => {
            kindHeading.current?.focus({ preventScroll: true });
          }}
        >
          {step === "kind" ? (
            <>
              <h2 id="do-laundry-title" ref={kindHeading} tabIndex={-1}>
                Choose a machine
              </h2>
              <div className="laundry-kind-choices">
                {(
                  [
                    ["washer", "Washer"],
                    ["dryer", "Dryer"],
                    ["all", "Both"],
                  ] as const
                ).map(([kind, label]) => (
                  <button
                    key={kind}
                    className="browse-choice"
                    onClick={() => onBrowse(kind)}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <button
                className="laundry-step-back"
                onClick={() => setStep("start")}
              >
                Back
              </button>
            </>
          ) : (
            <>
              <span className="dialog-eyebrow">SILLIMAN · ENTRYWAY M</span>
              <h2 id="do-laundry-title" ref={kindHeading} tabIndex={-1}>
                Do laundry
              </h2>
              {scanning && (
                <div className="qr-camera">
                  <video
                    ref={video}
                    muted
                    playsInline
                    aria-label="QR camera preview"
                  />
                  <span>
                    {cameraReady
                      ? "Point at the machine’s QR code"
                      : "Opening camera…"}
                  </span>
                </div>
              )}
              <button
                className="scan-button"
                onClick={() => {
                  setError("");
                  setCameraReady(false);
                  setScanning((s) => !s);
                }}
              >
                <QrCode size={21} />
                {scanning ? "Stop scanning" : "Scan QR code"}
              </button>
              <form
                onSubmit={(event) => {
                  event.preventDefault();
                  const id = resolveMachineCode(code);
                  if (id) onSelect(id);
                  else
                    setError(
                      "Enter W01–W10 for a washer or D01–D04 for a dryer.",
                    );
                }}
              >
                <label htmlFor="machine-code">Machine number</label>
                <div className="machine-code-field">
                  <input
                    id="machine-code"
                    value={code}
                    onChange={(event) => {
                      setCode(event.target.value);
                      setError("");
                    }}
                    placeholder="e.g. W03"
                    autoComplete="off"
                    autoCapitalize="characters"
                    spellCheck={false}
                    aria-describedby={error ? "lookup-error" : undefined}
                  />
                  <button type="submit" aria-label="Find machine">
                    <ArrowRight size={21} />
                  </button>
                </div>
              </form>
              {error && (
                <p className="lookup-error" id="lookup-error" role="alert">
                  {error}
                </p>
              )}
              <hr className="laundry-flow-divider" />
              <button
                className="browse-choice see-free-button"
                onClick={() => {
                  setScanning(false);
                  setError("");
                  setStep("kind");
                }}
              >
                See what's free
              </button>
            </>
          )}
        </motion.div>
      </AnimatePresence>
    </GlassDialog>
  );
}
