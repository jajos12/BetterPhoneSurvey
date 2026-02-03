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

    // Touch drag handlers for mobile
    const handleTouchStart = useCallback((e: React.TouchEvent, index: number) => {
        setTouchDragging(index);
        setDragOver(index);

        // Add visual feedback
        const target = e.currentTarget as HTMLDivElement;
        target.style.transform = 'scale(1.02)';
        target.style.boxShadow = '0 8px 25px rgba(0,0,0,0.15)';
        target.style.zIndex = '50';
    }, []);

    const handleTouchMove = useCallback((e: React.TouchEvent) => {
        if (touchDragging === null || !containerRef.current) return;

        const touch = e.touches[0];
        const container = containerRef.current;
        const containerRect = container.getBoundingClientRect();

        // Find which item the touch is over
        let newDragOver: number | null = null;
        itemRefs.current.forEach((ref, index) => {
            if (ref) {
                const rect = ref.getBoundingClientRect();
                const itemCenter = rect.top + rect.height / 2;
                const touchY = touch.clientY;

                // Check if touch is in the top or bottom half of the item
                if (touchY >= rect.top && touchY <= rect.bottom) {
                    newDragOver = index;
                }
            }
        });

        if (newDragOver !== null && newDragOver !== dragOver) {
            setDragOver(newDragOver);
        }

        // Prevent scrolling while dragging
        e.preventDefault();
    }, [touchDragging, dragOver]);

    const handleTouchEnd = useCallback((e: React.TouchEvent) => {
        if (touchDragging === null || dragOver === null) {
            setTouchDragging(null);
            setDragOver(null);
            return;
        }

        // Reset visual feedback
        const target = e.currentTarget as HTMLDivElement;
        target.style.transform = '';
        target.style.boxShadow = '';
        target.style.zIndex = '';

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

    // Move item up/down (arrows for accessibility)
    const moveItem = (index: number, direction: 'up' | 'down') => {
        const currentOrder = orderedItems.map(i => i.value);
        const newIndex = direction === 'up' ? index - 1 : index + 1;

        if (newIndex < 0 || newIndex >= currentOrder.length) return;

        const newOrder = [...currentOrder];
        [newOrder[index], newOrder[newIndex]] = [newOrder[newIndex], newOrder[index]];

        onChange(newOrder);
    };

    return (
        <div ref={containerRef} className="space-y-3">
            {/* Mobile instruction */}
            <p className="text-xs text-text-muted text-center sm:hidden mb-2">
                Hold and drag to reorder, or use arrows
            </p>

            {orderedItems.map((item, index) => (
                <div key={item.value} className="flex items-stretch gap-2 sm:gap-3">
                    {/* Fixed numbered slot */}
                    <div
                        className={`ranking-slot transition-all ${dragOver === index ? 'ring-2 ring-primary bg-primary/10' : ''
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
                        className={`ranking-item flex-1 transition-all ${dragging === item.value || touchDragging === index ? 'opacity-70' : ''
                            } ${dragOver === index && touchDragging !== null && touchDragging !== index ? 'border-t-2 border-primary' : ''}`}
                        style={{ touchAction: 'none' }}
                    >
                        {/* Drag handle */}
                        <div className="ranking-handle">
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M7 2a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 2zm6 0a2 2 0 1 0 .001 4.001A2 2 0 0 0 13 2zM7 8a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 8zm6 0a2 2 0 1 0 .001 4.001A2 2 0 0 0 13 8zM7 14a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 14zm6 0a2 2 0 1 0 .001 4.001A2 2 0 0 0 13 14z" />
                            </svg>
                        </div>

                        {/* Label */}
                        <span className="text-text-primary font-medium flex-1 text-sm sm:text-base">{item.label}</span>

                        {/* Mobile arrows */}
                        <div className="flex gap-1 sm:hidden">
                            <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); moveItem(index, 'up'); }}
                                disabled={index === 0}
                                className="p-1.5 rounded bg-gray-100 disabled:opacity-30 active:bg-gray-200"
                                aria-label="Move up"
                            >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
                                </svg>
                            </button>
                            <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); moveItem(index, 'down'); }}
                                disabled={index === orderedItems.length - 1}
                                className="p-1.5 rounded bg-gray-100 disabled:opacity-30 active:bg-gray-200"
                                aria-label="Move down"
                            >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                                </svg>
                            </button>
                        </div>
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
