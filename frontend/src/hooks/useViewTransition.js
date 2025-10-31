"use client";

import { useRouter } from "next/navigation";

export const useViewTransition = () => {
  const router = useRouter();

  const navigateWithTransition = (href, options = {}) => {
    if (typeof window === "undefined") {
      return;
    }

    const currentPath = window.location.pathname;
    if (currentPath === href) {
      return;
    }

    const executeNavigation = () => {
      try {
        router.push(href, options);
      } catch {
        window.location.href = href;
      }
    };

    const startViewTransition = document?.startViewTransition;

    if (typeof startViewTransition === "function") {
      try {
        startViewTransition(() => {
          executeNavigation();
        });
        return;
      } catch {
        // fall through to standard navigation
      }
    }

    executeNavigation();
  };

  return { navigateWithTransition, router };
};

