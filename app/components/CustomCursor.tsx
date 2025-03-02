import { useEffect, useRef, useState } from 'react';

const CustomCursor = () => {
  const cursorRef = useRef<HTMLDivElement>(null);
  const [mouseDetected, setMouseDetected] = useState(false);
  const [cursorStyle, setCursorStyle] = useState({
    width: 0,
    height: 0,
    opacity: 0.5,
  });

  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      if (!cursorRef.current) {
        return;
      }
      if (!mouseDetected) {
        setMouseDetected(true);
        setCursorStyle((prev) => ({
          ...prev,
          width: 48,
          height: 48,
        }));
      }
      cursorRef.current.style.left = `${event.clientX}px`;
      cursorRef.current.style.top = `${event.clientY}px`;
    };

    const handleMouseEnter = () => {
      setCursorStyle((prevStyle) => ({
        ...prevStyle,
        width: 20,
        height: 20,
        opacity: 0.8,
      }));
    };

    const handleMouseLeave = () => {
      setCursorStyle((prevStyle) => ({
        ...prevStyle,
        width: 48,
        height: 48,
        opacity: 0.5,
      }));
    };

    const handleMouseDown = () => {
      setCursorStyle((prevStyle) => ({
        ...prevStyle,
        width: 60,
        height: 60,
      }));
    };

    const handleMouseUp = () => {
      setCursorStyle((prevStyle) => ({
        ...prevStyle,
        width: 48,
        height: 48,
      }));
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('mouseup', handleMouseUp);
    const elements = document.querySelectorAll('button, a');
    for (const element of elements) {
      element.addEventListener('mouseenter', handleMouseEnter);
      element.addEventListener('mouseleave', handleMouseLeave);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('mouseup', handleMouseUp);
      const elements = document.querySelectorAll('button, a');
      for (const element of elements) {
        element.removeEventListener('mouseenter', handleMouseEnter);
        element.removeEventListener('mouseleave', handleMouseLeave);
      }
    };
  }, [cursorStyle, mouseDetected]);

  return (
    <div
      ref={cursorRef}
      className="fixed pointer-events-none h-0 w-0"
      style={{
        zIndex: 9999,
      }}
    >
      <div
        className="absolute inset-0 rounded-full bg-green-500"
        style={{
          ...cursorStyle,
          transition: 'width 0.2s, height 0.2s, opacity 0.2s',
          transform: 'translate(-50%, -50%)',
        }}
      />
    </div>
  );
};

export default CustomCursor;
