'use client';

import { useEffect, useRef } from 'react';
import { Character, CharacterRelationship } from '@/lib/types';

interface CharacterGraphProps {
  characters: Character[];
  relationships: CharacterRelationship[];
}

export function CharacterGraph({ characters, relationships }: CharacterGraphProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current || characters.length === 0) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    // Calculate positions in a circle
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = Math.min(canvas.width, canvas.height) / 3;

    const positions = new Map<string, { x: number; y: number }>();
    characters.forEach((char, index) => {
      const angle = (index / characters.length) * Math.PI * 2;
      positions.set(char.id, {
        x: centerX + Math.cos(angle) * radius,
        y: centerY + Math.sin(angle) * radius,
      });
    });

    // Clear canvas with gradient background
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    gradient.addColorStop(0, '#0f172a');
    gradient.addColorStop(1, '#1e293b');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw connections (relationships)
    ctx.strokeStyle = 'rgba(168, 85, 247, 0.3)';
    ctx.lineWidth = 2;
    relationships.forEach((rel) => {
      const fromPos = positions.get(rel.character_id);
      const toPos = positions.get(rel.related_character_id);
      if (fromPos && toPos) {
        ctx.beginPath();
        ctx.moveTo(fromPos.x, fromPos.y);
        ctx.lineTo(toPos.x, toPos.y);
        ctx.stroke();

        // Draw relationship type label
        const midX = (fromPos.x + toPos.x) / 2;
        const midY = (fromPos.y + toPos.y) / 2;
        ctx.fillStyle = 'rgba(196, 181, 253, 0.8)';
        ctx.font = 'bold 12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(rel.relationship_type, midX, midY - 10);
      }
    });

    // Draw character nodes
    characters.forEach((char) => {
      const pos = positions.get(char.id);
      if (!pos) return;

      // Draw circle
      const gradient = ctx.createRadialGradient(pos.x, pos.y, 0, pos.x, pos.y, 40);
      gradient.addColorStop(0, 'rgba(168, 85, 247, 0.8)');
      gradient.addColorStop(1, 'rgba(168, 85, 247, 0.3)');
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, 40, 0, Math.PI * 2);
      ctx.fill();

      // Draw border
      ctx.strokeStyle = 'rgba(196, 181, 253, 0.6)';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Draw character name
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 14px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(char.name, pos.x, pos.y);
    });
  }, [characters, relationships]);

  return (
    <canvas
      ref={canvasRef}
      className="w-full h-full border border-slate-700 rounded-lg bg-slate-900"
    />
  );
}
