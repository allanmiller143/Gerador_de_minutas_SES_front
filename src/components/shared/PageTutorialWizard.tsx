import React, { useEffect, useState, useLayoutEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  HelpCircle,
  X,
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
  Sparkles,
  LucideIcon,
} from "lucide-react";

export interface TutorialStep {
  target?: string; // CSS selector or data-tour identifier, e.g. '[data-tour="btn-create"]'
  title: string;
  description: string;
  icon?: LucideIcon;
  badgeText?: string;
  position?: "top" | "bottom" | "left" | "right" | "center";
}

interface PageTutorialWizardProps {
  steps: TutorialStep[];
  tutorialTitle?: string;
  buttonLabel?: string;
}

export const PageTutorialWizard: React.FC<PageTutorialWizardProps> = ({
  steps,
  tutorialTitle = "Tutorial da Página",
  buttonLabel = "Guia da Página",
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const [popoverSize, setPopoverSize] = useState({ width: 360, height: 260 });
  const [windowSize, setWindowSize] = useState({
    width: typeof window !== "undefined" ? window.innerWidth : 1920,
    height: typeof window !== "undefined" ? window.innerHeight : 1080,
  });
  const popoverRef = useRef<HTMLDivElement>(null);

  const step = steps[currentStep];

  // Track viewport window resize
  useEffect(() => {
    const handleResize = () => {
      setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Real-time synchronization of targetRect using requestAnimationFrame
  useEffect(() => {
    if (!isOpen || !step?.target) {
      setTargetRect(null);
      return;
    }

    const el = document.querySelector(step.target);
    if (!el) {
      setTargetRect(null);
      return;
    }

    // Scroll into view if not visible in viewport
    const initialRect = el.getBoundingClientRect();
    const isVisible =
      initialRect.top >= 0 &&
      initialRect.bottom <= window.innerHeight &&
      initialRect.left >= 0 &&
      initialRect.right <= window.innerWidth;

    if (!isVisible) {
      el.scrollIntoView({ behavior: "auto", block: "nearest" });
    }

    let animationFrameId: number;
    const syncTargetRect = () => {
      const currentEl = document.querySelector(step.target!);
      if (currentEl) {
        const r = currentEl.getBoundingClientRect();
        setTargetRect((prev) => {
          if (
            !prev ||
            Math.abs(prev.top - r.top) > 0.5 ||
            Math.abs(prev.left - r.left) > 0.5 ||
            Math.abs(prev.width - r.width) > 0.5 ||
            Math.abs(prev.height - r.height) > 0.5
          ) {
            return r;
          }
          return prev;
        });
      }
      animationFrameId = requestAnimationFrame(syncTargetRect);
    };

    animationFrameId = requestAnimationFrame(syncTargetRect);
    return () => cancelAnimationFrame(animationFrameId);
  }, [isOpen, currentStep, step?.target]);

  // Measure popover card rendered dimensions dynamically
  useLayoutEffect(() => {
    if (isOpen && popoverRef.current) {
      const rect = popoverRef.current.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        setPopoverSize({ width: rect.width, height: rect.height });
      }
    }
  }, [isOpen, currentStep]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === "Escape") {
        setIsOpen(false);
      } else if (e.key === "ArrowRight") {
        handleNext();
      } else if (e.key === "ArrowLeft") {
        handlePrev();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, currentStep, steps.length]);

  const handleStart = () => {
    setCurrentStep(0);
    setIsOpen(true);
  };

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep((prev) => prev + 1);
    } else {
      setIsOpen(false);
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  // Calculate popover style guaranteeing ZERO overlap with targetBox
  const getPopoverStyle = (): React.CSSProperties => {
    if (!targetRect) {
      return {
        position: "fixed",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
      };
    }

    const pWidth = popoverSize.width || 360;
    const pHeight = popoverSize.height || 260;
    const margin = 16;
    const gap = 16; // clearance from target highlight box

    // Target box including 6px highlight border padding
    const targetBox = {
      top: targetRect.top - 6,
      bottom: targetRect.bottom + 6,
      left: targetRect.left - 6,
      right: targetRect.right + 6,
      width: targetRect.width + 12,
      height: targetRect.height + 12,
    };

    const windowWidth = windowSize.width;
    const windowHeight = windowSize.height;

    const preferred = step?.position || "bottom";
    const candidates = Array.from(new Set([preferred, "left", "right", "bottom", "top"]));

    for (const pos of candidates) {
      let top = 0;
      let left = 0;

      if (pos === "bottom") {
        top = targetBox.bottom + gap;
        left = targetBox.left + targetBox.width / 2 - pWidth / 2;
      } else if (pos === "top") {
        top = targetBox.top - pHeight - gap;
        left = targetBox.left + targetBox.width / 2 - pWidth / 2;
      } else if (pos === "left") {
        top = targetBox.top + targetBox.height / 2 - pHeight / 2;
        left = targetBox.left - pWidth - gap;
      } else if (pos === "right") {
        top = targetBox.top + targetBox.height / 2 - pHeight / 2;
        left = targetBox.right + gap;
      }

      // Clamp so popover stays fully on screen
      const clampedLeft = Math.max(margin, Math.min(left, windowWidth - pWidth - margin));
      const clampedTop = Math.max(margin, Math.min(top, windowHeight - pHeight - margin));

      const popoverBox = {
        top: clampedTop,
        bottom: clampedTop + pHeight,
        left: clampedLeft,
        right: clampedLeft + pWidth,
      };

      // Strict overlap check (with 8px safety margin)
      const overlapsX =
        popoverBox.left < targetBox.right + 8 && popoverBox.right > targetBox.left - 8;
      const overlapsY =
        popoverBox.top < targetBox.bottom + 8 && popoverBox.bottom > targetBox.top - 8;
      const overlapsTarget = overlapsX && overlapsY;

      if (!overlapsTarget) {
        return {
          position: "fixed",
          top: `${clampedTop}px`,
          left: `${clampedLeft}px`,
          width: `${pWidth}px`,
        };
      }
    }

    // Absolute fallback: push popover completely outside targetBox Y
    let fallbackTop = targetBox.bottom + gap;
    if (fallbackTop + pHeight > windowHeight - margin) {
      fallbackTop = Math.max(margin, targetBox.top - pHeight - gap);
    }
    let fallbackLeft = targetBox.left + targetBox.width / 2 - pWidth / 2;
    fallbackLeft = Math.max(margin, Math.min(fallbackLeft, windowWidth - pWidth - margin));

    if (fallbackTop < targetBox.bottom && fallbackTop + pHeight > targetBox.top) {
      if (targetBox.top - pHeight - gap >= margin) {
        fallbackTop = targetBox.top - pHeight - gap;
      } else {
        fallbackTop = targetBox.bottom + gap;
      }
    }

    return {
      position: "fixed",
      top: `${fallbackTop}px`,
      left: `${fallbackLeft}px`,
      width: `${pWidth}px`,
    };
  };

  const IconComponent = step?.icon || Sparkles;

  return (
    <>
      {/* Floating Action Button at Bottom-Right */}
      <div className="fixed bottom-6 right-6 z-40 group flex items-center gap-2">
        <Button
          onClick={handleStart}
          size="lg"
          className="relative rounded-full px-5 py-6 shadow-xl bg-primary hover:bg-primary/90 text-primary-foreground font-semibold flex items-center gap-2.5 transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-primary/20 ring-4 ring-primary/10 active:scale-95"
          title="Iniciar tutorial explicativo da página"
        >
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary-foreground opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-primary-foreground"></span>
          </span>
          <HelpCircle className="h-5 w-5" />
          <span className="text-sm tracking-wide">{buttonLabel}</span>
        </Button>
      </div>

      {/* Tutorial Overlay Modal / Spotlight */}
      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          {/* Dark Overlay with Cutout Mask over target element (Pixel-perfect Viewport coverage) */}
          <svg
            className="fixed inset-0 w-full h-full pointer-events-auto cursor-pointer"
            onClick={() => setIsOpen(false)}
          >
            <defs>
              <mask id="tutorial-spotlight-mask">
                {/* Entire screen is white (shows dark overlay) */}
                <rect x="0" y="0" width="100%" height="100%" fill="white" />
                {/* Target cutout is black (hides dark overlay, making target region 100% light) */}
                {targetRect && (
                  <rect
                    x={targetRect.left - 6}
                    y={targetRect.top - 6}
                    width={targetRect.width + 12}
                    height={targetRect.height + 12}
                    rx="8"
                    fill="black"
                  />
                )}
              </mask>
            </defs>
            {/* Dark background rectangle with mask applied */}
            <rect
              x="0"
              y="0"
              width="100%"
              height="100%"
              fill="rgba(15, 23, 42, 0.75)"
              mask="url(#tutorial-spotlight-mask)"
            />
          </svg>

          {/* Spotlight Highlight Border & Glow Ring around target element */}
          {targetRect && (
            <div
              className="fixed rounded-lg border-2 border-primary ring-4 ring-primary/30 shadow-[0_0_25px_rgba(59,130,246,0.5)] transition-all duration-300 pointer-events-none z-50"
              style={{
                top: `${targetRect.top - 6}px`,
                left: `${targetRect.left - 6}px`,
                width: `${targetRect.width + 12}px`,
                height: `${targetRect.height + 12}px`,
              }}
            />
          )}

          {/* Step Popover Card */}
          <div
            ref={popoverRef}
            style={getPopoverStyle()}
            className="z-50 bg-card border text-card-foreground shadow-2xl rounded-xl p-5 space-y-4 animate-in fade-in zoom-in-95 duration-200"
          >
            {/* Header */}
            <div className="flex items-start justify-between gap-3 border-b pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-primary/10 text-primary">
                  <IconComponent className="h-5 w-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs font-semibold text-primary border-primary/30 bg-primary/5">
                      Passo {currentStep + 1} de {steps.length}
                    </Badge>
                    {step.badgeText && (
                      <Badge variant="secondary" className="text-[10px]">
                        {step.badgeText}
                      </Badge>
                    )}
                  </div>
                  <h3 className="font-bold text-base text-foreground mt-0.5">
                    {step.title}
                  </h3>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-muted-foreground hover:text-foreground rounded-full"
                onClick={() => setIsOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Description */}
            <div className="text-sm text-muted-foreground leading-relaxed">
              {step.description}
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-secondary h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-primary h-full transition-all duration-300"
                style={{
                  width: `${((currentStep + 1) / steps.length) * 100}%`,
                }}
              />
            </div>

            {/* Footer / Controls */}
            <div className="flex items-center justify-between pt-1">
              <div className="text-[11px] text-muted-foreground hidden sm:block">
                Use <kbd className="px-1 py-0.5 bg-muted rounded border text-[10px]">←</kbd> <kbd className="px-1 py-0.5 bg-muted rounded border text-[10px]">→</kbd> para navegar
              </div>

              <div className="flex items-center gap-2 ml-auto">
                {currentStep > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handlePrev}
                    className="h-8 text-xs gap-1"
                  >
                    <ChevronLeft className="h-3.5 w-3.5" />
                    Anterior
                  </Button>
                )}
                <Button
                  size="sm"
                  onClick={handleNext}
                  className="h-8 text-xs gap-1 font-semibold"
                >
                  {currentStep === steps.length - 1 ? (
                    <>
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Concluir
                    </>
                  ) : (
                    <>
                      Próximo
                      <ChevronRight className="h-3.5 w-3.5" />
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

