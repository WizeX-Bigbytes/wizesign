import React, { useRef, useState, useEffect } from 'react';
import { SignaturePadProps } from '../types';
import { Eraser, Check } from 'lucide-react';

export const SignaturePad: React.FC<SignaturePadProps> = ({ onSave }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [isEmpty, setIsEmpty] = useState(true);

  // Initialize canvas context with High DPI support
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resizeCanvas = () => {
       const parent = canvas.parentElement;
       if (parent) {
           const rect = parent.getBoundingClientRect();
           const ratio = Math.max(window.devicePixelRatio || 1, 1);
           
           // Set display size (css pixels)
           canvas.style.width = `${rect.width}px`;
           canvas.style.height = `250px`;
           
           // Set actual size in memory (scaled to account for extra pixel density)
           canvas.width = rect.width * ratio;
           canvas.height = 250 * ratio;

           // Normalize coordinate system to use css pixels
           ctx.scale(ratio, ratio);
           
           // Re-apply styles
           ctx.lineWidth = 2.5;
           ctx.lineCap = 'round';
           ctx.lineJoin = 'round';
           ctx.strokeStyle = '#0f172a'; // slate-900
       }
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    
    // Initial styles in case resize doesn't trigger immediately
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#0f172a';

    return () => window.removeEventListener('resize', resizeCanvas);
  }, []);

  const getPos = (e: React.MouseEvent | React.TouchEvent | TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    
    const rect = canvas.getBoundingClientRect();
    let clientX, clientY;

    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = (e as React.MouseEvent).clientX;
      clientY = (e as React.MouseEvent).clientY;
    }

    return {
      x: clientX - rect.left,
      y: clientY - rect.top
    };
  };

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    // e.preventDefault() is handled by style touch-action: none, but good to have safeguard for mouse
    setIsDrawing(true);
    const ctx = canvasRef.current?.getContext('2d');
    const { x, y } = getPos(e);
    ctx?.beginPath();
    ctx?.moveTo(x, y);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    const ctx = canvasRef.current?.getContext('2d');
    const { x, y } = getPos(e);
    ctx?.lineTo(x, y);
    ctx?.stroke();
    setIsEmpty(false);
  };

  const stopDrawing = () => {
    if (isDrawing) {
        setIsDrawing(false);
    }
  };

  const saveSignature = () => {
    const canvas = canvasRef.current;
    if (canvas && !isEmpty) {
      onSave(canvas.toDataURL());
    }
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (canvas && ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear entire scaled area
      setIsEmpty(true);
    }
  };

  return (
    <div className="w-full flex flex-col gap-4">
      <div className="border-2 border-slate-200 rounded-xl bg-slate-50 relative overflow-hidden shadow-inner group touch-none">
        <canvas
          ref={canvasRef}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
          className="w-full h-[250px] cursor-crosshair block"
          style={{ touchAction: 'none' }} // Critical for mobile to prevent scrolling
        />
        {isEmpty && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none text-slate-300">
                <span className="font-handwriting text-2xl opacity-50">Sign Here</span>
            </div>
        )}
      </div>
      
      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={clearSignature}
          className="flex items-center justify-center gap-2 text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 font-bold px-4 py-3 rounded-xl transition-all active:scale-[0.98]"
        >
          <Eraser className="w-4 h-4" /> Clear
        </button>
        <button
          type="button"
          onClick={saveSignature}
          disabled={isEmpty}
          className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-3 rounded-xl transition-all shadow-md shadow-blue-600/20 disabled:opacity-50 disabled:shadow-none active:scale-[0.98]"
        >
          <Check className="w-4 h-4" /> Adopt Signature
        </button>
      </div>
    </div>
  );
};