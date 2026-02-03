'use client';

import { useState, useRef, useCallback } from 'react';

interface DraggableRankingProps {
    items: { value: string; label: string }[];
    value: string[];
    onChange: (newOrder: string[]) => void;
}

export function DraggableRanking({ items, value, onChange }: DraggableRankingProps) {
    const [dragging, setDragging] = useState<string | null>(null);
    const [dragOver, setDragOver] = useState<number | null>(null);
    const [touchDragging, setTouchDragging] = useState<number | null>(null);
    const dragNode = useRef<HTMLDivElement | null>(null);
    const containerRef = useRef<HTMLDivElement | null>(null);
    const itemRefs = useRef<(HTMLDivElement | null)[]>([]);
    const touchStartY = useRef<number>(0);

    // Create ordered list: prioritize saved order, but include ALL items
    const orderedItems = (() => {
        const fromValue = value
            .map(v => items.find(i => i.value === v))
            .filter(Boolean) as { value: string; label: string }[];
        const remainingItems = items.filter(i => !value.includes(i.value));
        return [...fromValue, ...remainingItems];
    })();

    // Desktop drag handlers
    const handleDragStart = (e: React.DragEvent, item: string) => {
        setDragging(item);
        dragNode.current = e.target as HTMLDivElement;
        setTimeout(() => {
            if (dragNode.current) {
                dragNode.current.style.opacity = '0.5';
            }
        }, 0);
    };

    const handleDragEnd = () => {
        if (dragNode.current) {
            dragNode.current.style.opacity = '1';
        }
        setDragging(null);
        setDragOver(null);
        dragNode.current = null;
    };

    const handleDragOver = (e: React.DragEvent, index: number) => {
        e.preventDefault();
        if (dragging === null) return;
        setDragOver(index);
    };

    const handleDrop = (e: React.DragEvent, dropIndex: number) => {
        e.preventDefault();
        if (dragging === null) return;

        const currentOrder = orderedItems.map(i => i.value);
        const dragIndex = currentOrder.indexOf(dragging);

        if (dragIndex === dropIndex) {
            setDragOver(null);
            return;
        }

        const newOrder = [...currentOrder];
        newOrder.splice(dragIndex, 1);
        newOrder.splice(dropIndex, 0, dragging);

        onChange(newOrder);
        setDragOver(null);
    };

    // Touch drag handlers for mobile - improved responsiveness
    const handleTouchStart = useCallback((e: React.TouchEvent, index: number) => {
        touchStartY.current = e.touches[0].clientY;
        setTouchDragging(index);
        setDragOver(index);

        // Add visual feedback
        const target = e.currentTarget as HTMLDivElement;
        target.style.transform = 'scale(1.03)';
        target.style.boxShadow = '0 10px 30px rgba(0,0,0,0.2)';
        target.style.zIndex = '50';
        target.style.background = 'rgba(255,255,255,0.98)';
    }, []);

    const handleTouchMove = useCallback((e: React.TouchEvent) => {
        if (touchDragging === null) return;

        const touch = e.touches[0];

        // Find which item the touch is over
        let newDragOver: number | null = null;
        itemRefs.current.forEach((ref, index) => {
            if (ref) {
                const rect = ref.getBoundingClientRect();
                if (touch.clientY >= rect.top && touch.clientY <= rect.bottom) {
                    newDragOver = index;
                }
            }
        });

        if (newDragOver !== null && newDragOver !== dragOver) {
            setDragOver(newDragOver);
            // Add haptic feedback if available
            if (navigator.vibrate) {
                navigator.vibrate(10);
            }
        }

        // Prevent scrolling while dragging
        e.preventDefault();
    }, [touchDragging, dragOver]);

    const handleTouchEnd = useCallback((e: React.TouchEvent) => {
        // Reset visual feedback
        const target = e.currentTarget as HTMLDivElement;
        target.style.transform = '';
        target.style.boxShadow = '';
        target.style.zIndex = '';
        target.style.background = '';

        if (touchDragging === null || dragOver === null) {
            setTouchDragging(null);
            setDragOver(null);
            return;
        }

        if (touchDragging !== dragOver) {
            const currentOrder = orderedItems.map(i => i.value);
            const newOrder = [...currentOrder];

            // Remove from old position and insert at new position
            const [removed] = newOrder.splice(touchDragging, 1);
            newOrder.splice(dragOver, 0, removed);

            onChange(newOrder);
        }

        setTouchDragging(null);
        setDragOver(null);
    }, [touchDragging, dragOver, orderedItems, onChange]);

    return (
        <div ref={containerRef} className="space-y-3">
            {/* Mobile instruction */}
            <p className="text-xs text-text-muted text-center sm:hidden mb-2">
                Hold and drag to reorder
            </p>

            {orderedItems.map((item, index) => (
                <div key={item.value} className="flex items-stretch gap-2 sm:gap-3">
                    {/* Fixed numbered slot */}
                    <div
                        className={`ranking-slot transition-all ${dragOver === index && touchDragging !== null && touchDragging !== index ? 'ring-2 ring-primary bg-primary/10 scale-105' : ''
                            }`}
                        onDragOver={(e) => handleDragOver(e, index)}
                        onDrop={(e) => handleDrop(e, index)}
                    >
                        {index + 1}
                    </div>

                    {/* Draggable item */}
                    <div
                        ref={(el) => { itemRefs.current[index] = el; }}
                        draggable
                        onDragStart={(e) => handleDragStart(e, item.value)}
                        onDragEnd={handleDragEnd}
                        onDragOver={(e) => handleDragOver(e, index)}
                        onDrop={(e) => handleDrop(e, index)}
                        onTouchStart={(e) => handleTouchStart(e, index)}
                        onTouchMove={handleTouchMove}
                        onTouchEnd={handleTouchEnd}
                        className={`ranking-item flex-1 transition-all cursor-grab active:cursor-grabbing ${dragging === item.value || touchDragging === index ? 'opacity-80' : ''
                            } ${dragOver === index && touchDragging !== null && touchDragging !== index ? 'border-t-2 border-primary pt-3' : ''}`}
                        style={{ touchAction: 'none' }}
                    >
                        {/* Drag handle */}
                        <div className="ranking-handle text-gray-400">
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M7 2a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 2zm6 0a2 2 0 1 0 .001 4.001A2 2 0 0 0 13 2zM7 8a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 8zm6 0a2 2 0 1 0 .001 4.001A2 2 0 0 0 13 8zM7 14a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 14zm6 0a2 2 0 1 0 .001 4.001A2 2 0 0 0 13 14z" />
                            </svg>
                        </div>

                        {/* Label */}
                        <span className="text-text-primary font-medium flex-1 text-sm sm:text-base">{item.label}</span>
                    </div>
                </div>
            ))}

            {orderedItems.length === 0 && (
                <p className="text-text-muted text-center py-8">
                    No items to rank. Go back to select some issues first.
                </p>
            )}
        </div>
    );
}
