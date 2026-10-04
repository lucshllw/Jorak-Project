'use client';
import { Icon as SolarIcon } from '@iconify/react';
export default function Icon({ name, size = 20, className = '' }: { name: string; size?: number; className?: string }) {
  return <SolarIcon icon={`solar:${name}`} width={size} height={size} aria-hidden="true" className={className} />;
}
