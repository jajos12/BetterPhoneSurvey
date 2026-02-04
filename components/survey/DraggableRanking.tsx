'use client';

import { useState, useRef, useCallback, useEffect } from 'react';

interface DraggableRankingProps {
    items: { value: string; label: string }[];
    value: string[];
    onChange: (newOrder: string[]) => void;
}

export function DraggableRanking({ items, value, onChange }: DraggableRankingProps) {
    const [dragging, setDragging] = useState<string | null>(null);
    const [dragOver, setDragOver] = useState<number | null>(null);
    const [touchDragging, setTouchDragging] = useState<number | null>(null);
    const [touchOffset, setTouchOffset] = useState<number>(0);

    const containerRef = useRef<HTMLDivElement | null>(null);
    const itemRefs = useRef<(HTMLDivElement | null)[]>([]);
    const touchStartY = useRef<number>(0);

    // Create ordered list
    const orderedItems = (() => {
        const fromValue = value
            .map(v => items.find(i => i.value === v))
            .filter(Boolean) as { value: string; label: string }[];
        const remainingItems = items.filter(i => !value.includes(i.value));
        return [...fromValue, ...remainingItems];
    })();

    // Desktop Drag Handlers (Standard)
    const handleDragStart = (e: React.DragEvent, item: string) => {
        setDragging(item);
        e.dataTransfer.setData('text/plain', item);
        setTimeout(() => {
            const target = e.target as HTMLElement;
            target.style.opacity = '0.4';
        }, 0);
    };

    const handleDragEnd = (e: React.DragEvent) => {
        const target = e.target as HTMLElement;
        target.style.opacity = '1';
        setDragging(null);
        setDragOver(null);
    };

    const handleDragOver = (e: React.DragEvent, index: number) => {
        e.preventDefault();
        if (dragging === null) return;
        if (dragOver !== index) {
            setDragOver(index);
        }
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

    // Touch Drag Handlers - SMOOTH SHIFT
    const handleTouchStart = useCallback((e: React.TouchEvent, index: number) => {
        const touch = e.touches[0];
        touchStartY.current = touch.clientY;

        setTouchDragging(index);
        setDragOver(index);
        setTouchOffset(0);

        if (navigator.vibrate) {
            navigator.vibrate(15);
        }
    }, []);

    const handleTouchMove = useCallback((e: React.TouchEvent) => {
        if (touchDragging === null) return;

        // Prevent scroll while dragging
        e.preventDefault();

        const touch = e.touches[0];
        const deltaY = touch.clientY - touchStartY.current;
        const touchY = touch.clientY;
        setTouchOffset(deltaY);

        // Find which slot we're over using direct hit-test
        let targetIndex = dragOver;

        // Quick boundary checks
        const firstRect = itemRefs.current[0]?.getBoundingClientRect();
        const lastRect = itemRefs.current[itemRefs.current.length - 1]?.getBoundingClientRect();

        if (firstRect && touchY < firstRect.top) {
            targetIndex = 0;
        } else if (lastRect && touchY > lastRect.bottom) {
            targetIndex = itemRefs.current.length - 1;
        } else {
            for (let i = 0; i < itemRefs.current.length; i++) {
                const ref = itemRefs.current[i];
                if (ref) {
                    const rect = ref.getBoundingClientRect();
                    if (touchY >= rect.top && touchY <= rect.bottom) {
                        targetIndex = i;
                        break;
                    }
                }
            }
        }

        if (targetIndex !== null && targetIndex !== dragOver) {
            setDragOver(targetIndex);
            if (navigator.vibrate) {
                navigator.vibrate(5);
            }
        }
    }, [touchDragging, dragOver]);

    const handleTouchEnd = useCallback(() => {
        if (touchDragging !== null && dragOver !== null && touchDragging !== dragOver) {
            const currentOrder = orderedItems.map(i => i.value);
            const newOrder = [...currentOrder];
            const [removed] = newOrder.splice(touchDragging, 1);
            newOrder.splice(dragOver, 0, removed);
            onChange(newOrder);
        }

        setTouchDragging(null);
        setDragOver(null);
        setTouchOffset(0);
    }, [touchDragging, dragOver, orderedItems, onChange]);

    return (
        <div ref={containerRef} className="space-y-3 py-2">
            <p className="text-xs text-text-muted text-center sm:hidden mb-2">
                Hold and drag items to reorder
            </p>

            {orderedItems.map((item, index) => {
                const isDragging = touchDragging === index;
                const isOtherItem = touchDragging !== null && !isDragging;

                let translateY = 0;

                // Calculate "Shift" for other items
                if (isOtherItem && dragOver !== null && touchDragging !== null) {
                    const itemHeight = 60; // Approximate height + gap

                    if (index > touchDragging && index <= dragOver) {
                        // Dragging down: items between start and end shift UP
                        translateY = -itemHeight;
                    } else if (index < touchDragging && index >= dragOver) {
                        // Dragging up: items between end and start shift DOWN
                        translateY = itemHeight;
                    }
                }

                return (
                    <div
                        key={item.value}
                        ref={(el) => { itemRefs.current[index] = el; }}
                        style={{
                            transform: isDragging
                                ? `translateY(${touchOffset}px) scale(1.04)`
                                : `translateY(${translateY}px)`,
                            zIndex: isDragging ? 50 : 0,
                            transition: isDragging ? 'none' : 'transform 0.25s cubic-bezier(0.2, 0, 0, 1)',
                            position: 'relative',
                            touchAction: 'none'
                        }}
                        className={`group flex items-stretch gap-3 ${isDragging ? 'pointer-events-none' : ''}`}
                    >
                        {/* Rank number */}
                        <div className={`w-10 h-10 flex-shrink-0 rounded-xl flex items-center justify-center font-bold transition-all duration-300 ${isDragging
                            ? 'bg-primary text-white shadow-lg'
                            : 'bg-gray-100 text-gray-500'
                            }`}>
                            {index + 1}
                        </div>

                        {/* Draggable item */}
                        <div
                            draggable
                            onDragStart={(e) => handleDragStart(e, item.value)}
                            onDragEnd={handleDragEnd}
                            onDragOver={(e) => handleDragOver(e, index)}
                            onDrop={(e) => handleDrop(e, index)}
                            onTouchStart={(e) => handleTouchStart(e, index)}
                            onTouchMove={handleTouchMove}
                            onTouchEnd={handleTouchEnd}
                            className={`flex-1 flex items-center gap-3 px-5 py-3.5 rounded-2xl border-2 transition-all duration-300 cursor-grab active:cursor-grabbing select-none ${isDragging
                                ? 'bg-white border-primary shadow-2xl ring-4 ring-primary/5'
                                : dragOver === index && dragging !== null
                                    ? 'bg-primary/5 border-primary ring-2 ring-primary/10'
                                    : 'bg-white border-gray-100 hover:border-gray-300 hover:shadow-md'
                                }`}
                        >
                            {/* Drag handle */}
                            <div className={`transition-colors ${isDragging ? 'text-primary' : 'text-gray-300 group-hover:text-gray-400'}`}>
                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M7 2a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 2zm6 0a2 2 0 1 0 .001 4.001A2 2 0 0 0 13 2zM7 8a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 8zm6 0a2 2 0 1 0 .001 4.001A2 2 0 0 0 13 8zM7 14a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 14zm6 0a2 2 0 1 0 .001 4.001A2 2 0 0 0 13 14z" />
                                </svg>
                            </div>

                            {/* Label */}
                            <span className={`text-base font-semibold flex-1 transition-colors ${isDragging ? 'text-primary' : 'text-text-primary'
                                }`}>
                                {item.label}
                            </span>
                        </div>
                    </div>
                );
            })}

            {orderedItems.length === 0 && (
                <p className="text-text-muted text-center py-10 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
                    No items selected to rank.
                </p>
            )}
        </div>
    );
}
