import React, { useState, useRef, useEffect } from 'react';
import { cn } from '../../utils/cn';

interface SwipeableCardProps {
  children: React.ReactNode;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  leftAction?: {
    icon: React.ReactNode;
    label: string;
    color: string;
  };
  rightAction?: {
    icon: React.ReactNode;
    label: string;
    color: string;
  };
  className?: string;
  disabled?: boolean;
}

export function SwipeableCard({
  children,
  onSwipeLeft,
  onSwipeRight,
  leftAction,
  rightAction,
  className = '',
  disabled = false
}: SwipeableCardProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);
  const [startX, setStartX] = useState(0);
  const cardRef = useRef<HTMLDivElement>(null);

  const threshold = 100; // Minimum distance to trigger action

  const handleStart = (clientX: number) => {
    if (disabled) return;
    setIsDragging(true);
    setStartX(clientX);
  };

  const handleMove = (clientX: number) => {
    if (!isDragging || disabled) return;
    
    const diff = clientX - startX;
    setDragOffset(diff);
  };

  const handleEnd = () => {
    if (!isDragging || disabled) return;
    
    setIsDragging(false);
    
    if (Math.abs(dragOffset) > threshold) {
      if (dragOffset > 0 && onSwipeRight) {
        onSwipeRight();
      } else if (dragOffset < 0 && onSwipeLeft) {
        onSwipeLeft();
      }
    }
    
    setDragOffset(0);
  };

  // Mouse events
  const handleMouseDown = (e: React.MouseEvent) => {
    handleStart(e.clientX);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    handleMove(e.clientX);
  };

  const handleMouseUp = () => {
    handleEnd();
  };

  // Touch events
  const handleTouchStart = (e: React.TouchEvent) => {
    handleStart(e.touches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    handleMove(e.touches[0].clientX);
  };

  const handleTouchEnd = () => {
    handleEnd();
  };

  // Global mouse events
  useEffect(() => {
    if (isDragging) {
      const handleGlobalMouseMove = (e: MouseEvent) => {
        handleMove(e.clientX);
      };

      const handleGlobalMouseUp = () => {
        handleEnd();
      };

      document.addEventListener('mousemove', handleGlobalMouseMove);
      document.addEventListener('mouseup', handleGlobalMouseUp);

      return () => {
        document.removeEventListener('mousemove', handleGlobalMouseMove);
        document.removeEventListener('mouseup', handleGlobalMouseUp);
      };
    }
  }, [isDragging, startX]);

  const getBackgroundColor = () => {
    if (Math.abs(dragOffset) < threshold) return '';
    
    if (dragOffset > 0 && rightAction) {
      return rightAction.color;
    } else if (dragOffset < 0 && leftAction) {
      return leftAction.color;
    }
    
    return '';
  };

  const getActionContent = () => {
    if (Math.abs(dragOffset) < threshold) return null;
    
    if (dragOffset > 0 && rightAction) {
      return (
        <div className="absolute left-4 top-1/2 transform -translate-y-1/2 flex items-center space-x-2 text-white">
          {rightAction.icon}
          <span className="font-medium">{rightAction.label}</span>
        </div>
      );
    } else if (dragOffset < 0 && leftAction) {
      return (
        <div className="absolute right-4 top-1/2 transform -translate-y-1/2 flex items-center space-x-2 text-white">
          <span className="font-medium">{leftAction.label}</span>
          {leftAction.icon}
        </div>
      );
    }
    
    return null;
  };

  return (
    <div className="relative overflow-hidden rounded-lg">
      {/* Background action */}
      <div 
        className={cn(
          'absolute inset-0 transition-colors duration-200',
          getBackgroundColor()
        )}
      >
        {getActionContent()}
      </div>
      
      {/* Card content */}
      <div
        ref={cardRef}
        className={cn(
          'relative bg-white transition-transform duration-200 select-none',
          isDragging ? 'cursor-grabbing' : 'cursor-grab',
          disabled && 'cursor-default',
          className
        )}
        style={{
          transform: `translateX(${dragOffset}px)`,
        }}
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {children}
      </div>
    </div>
  );
}