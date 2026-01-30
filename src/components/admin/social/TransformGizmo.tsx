import React from 'react';
import { BRAND } from './brand';

interface Transform {
    x: number;
    y: number;
    scale: number;
    rotate: number;
}

interface TransformGizmoProps {
    id: string | number;
    selectedId: string | number | null;
    transform: Transform;
    radius: number;
    onDragStart: (e: React.PointerEvent, id: string | number, mode: 'move' | 'transform') => void;
}

export const TransformGizmo = ({ id, selectedId, transform, radius, onDragStart }: TransformGizmoProps) => {
    if (selectedId !== id) return null;

    // Position of the handle based on radius
    const handleDist = radius * transform.scale + 40; // Offset slightly outside
    const handleX = handleDist;
    const handleY = 0;

    return (
        <g
            transform={`translate(${transform.x}, ${transform.y}) rotate(${transform.rotate})`}
            className="pointer-events-none z-50"
        >
            {/* Visual Ring */}
            <circle
                r={radius * transform.scale + 10}
                fill="none"
                stroke={BRAND.colors.primary.yellow}
                strokeWidth="2"
                strokeDasharray="8 4"
                className="opacity-70"
            />

            {/* Scale/Rotate Handle Line */}
            <line
                x1={0} y1={0} x2={handleX} y2={handleY}
                stroke={BRAND.colors.primary.yellow}
                strokeWidth="1"
                className="opacity-50"
            />

            {/* The Handle Target */}
            <g
                className="pointer-events-auto cursor-alias"
                onPointerDown={(e) => onDragStart(e, id, 'transform')}
            >
                <circle cx={handleX} cy={handleY} r="15" fill={BRAND.colors.primary.yellow} className="shadow-lg" />
                <circle cx={handleX} cy={handleY} r="6" fill={BRAND.colors.secondary.black} />
            </g>
        </g>
    );
};
