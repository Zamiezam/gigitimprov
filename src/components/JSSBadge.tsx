import React from 'react';

interface JSSBadgeProps {
  score: number; // 0-100
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

export default function JSSBadge({ score, size = 'md', showLabel = true }: JSSBadgeProps) {
  const radius = size === 'sm' ? 18 : size === 'lg' ? 30 : 22;
  const stroke = size === 'sm' ? 3 : size === 'lg' ? 5 : 4;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference - (score / 100) * circumference;

  const color = score >= 90 ? '#22c55e' : score >= 75 ? '#3b82f6' : score >= 60 ? '#f59e0b' : '#ef4444';
  const label = score >= 90 ? 'Top Rated' : score >= 75 ? 'Rising Talent' : score >= 60 ? 'Good' : 'Developing';

  const svgSize = (radius + stroke) * 2 + 4;
  const center = svgSize / 2;

  const textSize = size === 'sm' ? 'text-[8px]' : size === 'lg' ? 'text-sm' : 'text-[10px]';

  return (
    <div className="flex items-center gap-2">
      <div className="relative flex items-center justify-center" style={{ width: svgSize, height: svgSize }}>
        <svg width={svgSize} height={svgSize} className="-rotate-90">
          {/* Track */}
          <circle
            cx={center} cy={center} r={radius}
            fill="none" stroke="currentColor" strokeWidth={stroke}
            className="text-surface-container-high"
          />
          {/* Progress */}
          <circle
            cx={center} cy={center} r={radius}
            fill="none"
            stroke={color}
            strokeWidth={stroke}
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            strokeLinecap="round"
            style={{ transition: 'stroke-dashoffset 0.6s ease' }}
          />
        </svg>
        <span
          className={`absolute font-black font-display ${textSize}`}
          style={{ color }}
        >
          {score}
        </span>
      </div>
      {showLabel && (
        <div>
          <p className="text-[10px] font-black" style={{ color }}>{label}</p>
          <p className="text-[9px] text-on-surface-variant font-medium">SWEAT™️ Score</p>
        </div>
      )}
    </div>
  );
}
