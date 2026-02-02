/**
 * Utility functions for testing responsive behavior
 */

export const isMobile = (): boolean => {
  return window.innerWidth < 768;
};

export const isTablet = (): boolean => {
  return window.innerWidth >= 768 && window.innerWidth < 1024;
};

export const isDesktop = (): boolean => {
  return window.innerWidth >= 1024;
};

export const getCurrentBreakpoint = (): string => {
  if (window.innerWidth < 640) return 'sm';
  if (window.innerWidth < 768) return 'md';
  if (window.innerWidth < 1024) return 'lg';
  if (window.innerWidth < 1280) return 'xl';
  return '2xl';
};