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
    const [touchOffset, setTouchOffset] = useState<number>(0);

    const dragNode = useRef<HTMLDivElement | null>(null);
    const containerRef = useRef<HTMLDivElement | null>(null);
    const itemRefs = useRef<(HTMLDivElement | null)[]>([]);
    const touchStartY = useRef<number>(0);
    const initialY = useRef<number>(0);

    // Create ordered list
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

    // Touch drag handlers - FOLLOW FINGER
    const handleTouchStart = useCallback((e: React.TouchEvent, index: number) => {
        const touch = e.touches[0];
        const target = e.currentTarget as HTMLDivElement;
        const rect = target.getBoundingClientRect();

        touchStartY.current = touch.clientY;
        initialY.current = rect.top;

        setTouchDragging(index);
        setDragOver(index);
        setTouchOffset(0);

        // Haptic feedback
        if (navigator.vibrate) {
            navigator.vibrate(15);
        }
    }, []);

    const handleTouchMove = useCallback((e: React.TouchEvent) => {
        if (touchDragging === null) return;
        e.preventDefault();

        const touch = e.touches[0];
        const deltaY = touch.clientY - touchStartY.current;
        setTouchOffset(deltaY);

        // Find which slot we're over
        let newDragOver = touchDragging;
        itemRefs.current.forEach((ref, index) => {
            if (ref && index !== touchDragging) {
                const rect = ref.getBoundingClientRect();
                const middle = rect.top + rect.height / 2;

                if (touch.clientY < middle && index < touchDragging!) {
                    newDragOver = index;
                } else if (touch.clientY > middle && index > touchDragging!) {
                    newDragOver = index;
                }
            }
        });

        if (newDragOver !== dragOver) {
            setDragOver(newDragOver);
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
        <div ref={containerRef} className="space-y-2">
            {/* Mobile instruction */}
            <p className="text-xs text-gray-500 text-center sm:hidden mb-3">
                Hold and drag to reorder
            </p>

            {orderedItems.map((item, index) => {
                const isDraggingThis = touchDragging === index;
                const isDropTarget = dragOver === index && touchDragging !== null && touchDragging !== index;

                return (
                    <div
                        key={item.value}
                        className="flex items-stretch gap-2"
                        style={{
                            transition: isDraggingThis ? 'none' : 'transform 0.15s ease-out',
                            transform: isDraggingThis
                                ? `translateY(${touchOffset}px) scale(1.02)`
                                : isDropTarget
                                    ? 'scale(1.02)'
                                    : 'none',
                            zIndex: isDraggingThis ? 50 : 'auto',
                            position: 'relative',
                        }}
                    >
                        {/* Rank number */}
                        <div className={`w-10 h-10 flex-shrink-0 rounded-xl flex items-center justify-center font-bold transition-all ${isDropTarget
                                ? 'bg-primary text-white'
                                : 'bg-gray-100 text-gray-600'
                            }`}>
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
                            className={`flex-1 flex items-center gap-3 px-4 py-3 rounded-xl border-2 transition-all cursor-grab active:cursor-grabbing select-none ${isDraggingThis
                                    ? 'bg-white border-primary shadow-xl'
                                    : isDropTarget
                                        ? 'bg-primary/5 border-primary'
                                        : 'bg-white border-gray-200 hover:border-gray-300'
                                }`}
                            style={{ touchAction: 'none' }}
                        >
                            {/* Drag handle */}
                            <div className="text-gray-400">
                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M7 2a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 2zm6 0a2 2 0 1 0 .001 4.001A2 2 0 0 0 13 2zM7 8a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 8zm6 0a2 2 0 1 0 .001 4.001A2 2 0 0 0 13 8zM7 14a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 14zm6 0a2 2 0 1 0 .001 4.001A2 2 0 0 0 13 14z" />
                                </svg>
                            </div>

                            {/* Label */}
                            <span className="text-gray-800 font-medium flex-1">{item.label}</span>
                        </div>
                    </div>
                );
            })}

            {orderedItems.length === 0 && (
                <p className="text-gray-500 text-center py-8">
                    No items to rank.
                </p>
            )}
        </div>
    );
}
