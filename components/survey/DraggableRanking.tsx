'use client';

import { useState, useRef } from 'react';

interface DraggableRankingProps {
    items: { value: string; label: string }[];
    value: string[];
    onChange: (newOrder: string[]) => void;
}

export function DraggableRanking({ items, value, onChange }: DraggableRankingProps) {
    const [dragging, setDragging] = useState<string | null>(null);
    const [dragOver, setDragOver] = useState<number | null>(null);
    const dragNode = useRef<HTMLDivElement | null>(null);

    // Create ordered list: prioritize saved order, but include ALL items
    // Items in value come first (in saved order), then any new items not in value
    const orderedItems = (() => {
        // Start with items that are in the saved value (in their saved order)
        const fromValue = value
            .map(v => items.find(i => i.value === v))
            .filter(Boolean) as { value: string; label: string }[];

        // Add any items that weren't in the saved value
        const remainingItems = items.filter(i => !value.includes(i.value));

        return [...fromValue, ...remainingItems];
    })();

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

        // Remove from old position and insert at new position
        const newOrder = [...currentOrder];
        newOrder.splice(dragIndex, 1);
        newOrder.splice(dropIndex, 0, dragging);

        onChange(newOrder);
        setDragOver(null);
    };

    return (
        <div className="space-y-3">
            {orderedItems.map((item, index) => (
                <div key={item.value} className="flex items-stretch gap-3">
                    {/* Fixed numbered slot */}
                    <div
                        className={`ranking-slot ${dragOver === index ? 'drag-over' : ''}`}
                        onDragOver={(e) => handleDragOver(e, index)}
                        onDrop={(e) => handleDrop(e, index)}
                    >
                        {index + 1}
                    </div>

                    {/* Draggable item */}
                    <div
                        draggable
                        onDragStart={(e) => handleDragStart(e, item.value)}
                        onDragEnd={handleDragEnd}
                        onDragOver={(e) => handleDragOver(e, index)}
                        onDrop={(e) => handleDrop(e, index)}
                        className={`ranking-item ${dragging === item.value ? 'dragging' : ''}`}
                    >
                        {/* Drag handle */}
                        <div className="ranking-handle">
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M7 2a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 2zm6 0a2 2 0 1 0 .001 4.001A2 2 0 0 0 13 2zM7 8a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 8zm6 0a2 2 0 1 0 .001 4.001A2 2 0 0 0 13 8zM7 14a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 14zm6 0a2 2 0 1 0 .001 4.001A2 2 0 0 0 13 14z" />
                            </svg>
                        </div>

                        {/* Label */}
                        <span className="text-text-primary font-medium">{item.label}</span>
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
