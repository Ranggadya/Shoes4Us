import { RefObject, useEffect, useRef } from "react";

interface UseDialogFocusTrapOptions {
  isOpen: boolean;
  onClose?: () => void;
  containerRef: RefObject<HTMLElement | null>;
  initialFocusRef?: RefObject<HTMLElement | null>;
  restoreFocusRef?: RefObject<HTMLElement | null>;
  lockScroll?: boolean;
  canClose?: boolean;
}

const FOCUSABLE_SELECTOR =
  'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function useDialogFocusTrap({
  isOpen,
  onClose,
  containerRef,
  initialFocusRef,
  restoreFocusRef,
  lockScroll = true,
  canClose = true,
}: UseDialogFocusTrapOptions) {
  const wasOpenRef = useRef(false);
  const previousFocusedRef = useRef<HTMLElement | null>(null);
  const onCloseRef = useRef(onClose);
  const canCloseRef = useRef(canClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    canCloseRef.current = canClose;
  }, [canClose]);

  useEffect(() => {
    if (isOpen) {
      wasOpenRef.current = true;
      previousFocusedRef.current = document.activeElement as HTMLElement | null;

      const previousOverflow = document.body.style.overflow;
      if (lockScroll) {
        document.body.style.overflow = "hidden";
      }

      const getFocusableElements = (): HTMLElement[] => {
        if (!containerRef.current) return [];
        return Array.from(
          containerRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)
        );
      };

      if (initialFocusRef?.current) {
        initialFocusRef.current.focus();
      } else {
        const focusable = getFocusableElements();
        focusable[0]?.focus();
      }

      const handleKeyDown = (event: KeyboardEvent) => {
        if (event.key === "Escape") {
          if (canCloseRef.current) {
            event.preventDefault();
            onCloseRef.current?.();
          }
          return;
        }

        if (event.key === "Tab") {
          const focusable = getFocusableElements();
          if (focusable.length === 0) {
            event.preventDefault();
            return;
          }

          const first = focusable[0];
          const last = focusable[focusable.length - 1];
          const active = document.activeElement as HTMLElement | null;

          if (event.shiftKey) {
            if (active === first || !containerRef.current?.contains(active)) {
              event.preventDefault();
              last.focus();
            }
          } else if (active === last || !containerRef.current?.contains(active)) {
            event.preventDefault();
            first.focus();
          }
        }
      };

      window.addEventListener("keydown", handleKeyDown);
      return () => {
        if (lockScroll) {
          document.body.style.overflow = previousOverflow;
        }
        window.removeEventListener("keydown", handleKeyDown);
      };
    }

    if (wasOpenRef.current) {
      wasOpenRef.current = false;
      const targetToRestore =
        restoreFocusRef?.current ?? previousFocusedRef.current;
      targetToRestore?.focus?.();
      previousFocusedRef.current = null;
    }
  }, [isOpen, containerRef, initialFocusRef, restoreFocusRef, lockScroll]);
}
