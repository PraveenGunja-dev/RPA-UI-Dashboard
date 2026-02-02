import React, { useState, useEffect } from 'react';
import { getCurrentBreakpoint } from '@/utils/responsiveTest';

const ResponsiveTest: React.FC = () => {
  const [breakpoint, setBreakpoint] = useState<string>('');

  useEffect(() => {
    const updateBreakpoint = () => {
      setBreakpoint(getCurrentBreakpoint());
    };

    // Set initial breakpoint
    updateBreakpoint();

    // Add event listener for window resize
    window.addEventListener('resize', updateBreakpoint);

    // Cleanup event listener on component unmount
    return () => {
      window.removeEventListener('resize', updateBreakpoint);
    };
  }, []);

  return (
    <div className="fixed bottom-4 right-4 bg-white p-2 rounded shadow-lg text-xs">
      <div>Current Breakpoint: <span className="font-bold">{breakpoint}</span></div>
      <div>Window Width: <span className="font-bold">{window.innerWidth}px</span></div>
    </div>
  );
};

export default ResponsiveTest;