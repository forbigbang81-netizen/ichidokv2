"use client";
import { useState } from "react";
import { AnimePoster as PosterConfig } from "@/lib/anime";
import { cn } from "@/lib/utils";

type Props = {
  title: string;
  poster: PosterConfig;
  imageUrl?: string;
  className?: string;
  showTitle?: boolean;
};

/**
 * AnimePoster — renders a real anime poster image when available (Kitsu/MAL),
 * with a deterministic SVG poster as fallback (when no image_url is set or
 * the image fails to load).
 */
export function AnimePoster({ title, poster, imageUrl, className, showTitle = true }: Props) {
  const [imageError, setImageError] = useState(false);
  const hasImage = imageUrl && !imageError;

  if (hasImage) {
    return (
      <div className={cn("relative h-full w-full overflow-hidden bg-card", className)}>
        <img
          src={imageUrl}
          alt={`${title} poster`}
          loading="lazy"
          onError={() => setImageError(true)}
          className="absolute inset-0 h-full w-full object-cover"
        />
        {showTitle && (
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black via-black/60 to-transparent p-3 pt-10">
            <div className="mb-1.5 h-px w-6 bg-white/70" />
            <h3 className="line-clamp-2 text-xs font-bold leading-tight tracking-tight text-white">
              {title}
            </h3>
          </div>
        )}
      </div>
    );
  }

  return <SvgPoster title={title} poster={poster} className={className} showTitle={showTitle} />;
}

/**
 * SvgPoster — deterministic black & white SVG poster used as fallback.
 * Generated from the title hash so each anime gets a unique-looking poster.
 */
function SvgPoster({
  title,
  poster,
  className,
  showTitle = true,
}: {
  title: string;
  poster: PosterConfig;
  className?: string;
  showTitle?: boolean;
}) {
  const { variant, l1, l2, angle, hash } = poster;
  const id = `pg-${hash}`;
  const words = title.split(/\s+/).filter(Boolean);
  const long = words.length > 4 || title.length > 22;

  const renderPattern = () => {
    switch (variant) {
      case 0:
        return (
          <polygon
            points={`0,0 200,0 200,${100 + (angle % 80)} 0,${200 - (angle % 80)}`}
            fill={`hsl(0 0% ${l2}%)`}
          />
        );
      case 1:
        return (
          <>
            <rect x="0" y={40 + (angle % 30)} width="200" height="35" fill={`hsl(0 0% ${l2}%)`} />
            <rect x="0" y={130 + (angle % 30)} width="200" height="20" fill={`hsl(0 0% ${Math.min(l2 + 5, 95)}%)`} />
          </>
        );
      case 2:
        return (
          <circle cx={100} cy={100} r={70 + (angle % 20)} fill={`hsl(0 0% ${l2}%)`} />
        );
      case 3:
        return (
          <g fill={`hsl(0 0% ${l2}%)`}>
            <polygon points="0,200 100,120 200,200" />
            <polygon points="0,150 100,70 200,150" opacity="0.5" />
          </g>
        );
      case 4:
        return (
          <g fill={`hsl(0 0% ${l2}%)`}>
            <rect x="20" y="20" width="60" height="60" />
            <rect x="120" y="40" width="60" height="40" opacity="0.7" />
            <rect x="40" y="120" width="40" height="60" opacity="0.8" />
            <rect x="110" y="130" width="70" height="50" opacity="0.5" />
          </g>
        );
      case 5:
      default:
        return (
          <g>
            <rect x="0" y="0" width="200" height="200" fill={`hsl(0 0% ${l1 + 8}%)`} />
            <polygon
              points={`${angle % 60},200 ${100 + (angle % 60)},0 ${130 + (angle % 60)},0 ${30 + (angle % 60)},200`}
              fill={`hsl(0 0% ${l2}%)`}
            />
            <polygon
              points={`${80 + (angle % 40)},200 ${180 + (angle % 40)},0 ${200},0 ${200},200`}
              fill={`hsl(0 0% ${Math.max(l1 - 3, 4)}%)`}
            />
          </g>
        );
    }
  };

  return (
    <svg
      viewBox="0 0 200 280"
      xmlns="http://www.w3.org/2000/svg"
      preserveAspectRatio="xMidYMid slice"
      className={className}
      role="img"
      aria-label={`${title} poster`}
    >
      <defs>
        <linearGradient id={`${id}-bg`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={`hsl(0 0% ${l1 + 6}%)`} />
          <stop offset="100%" stopColor={`hsl(0 0% ${Math.max(l1 - 4, 3)}%)`} />
        </linearGradient>
        <pattern id={`${id}-noise`} x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
          <rect width="40" height="40" fill="none" />
          <circle cx="6" cy="8" r="0.5" fill={`hsl(0 0% ${l2}%)`} opacity="0.35" />
          <circle cx="22" cy="14" r="0.4" fill={`hsl(0 0% ${l2}%)`} opacity="0.25" />
          <circle cx="32" cy="30" r="0.6" fill={`hsl(0 0% ${l2}%)`} opacity="0.3" />
          <circle cx="14" cy="26" r="0.3" fill={`hsl(0 0% ${l2}%)`} opacity="0.2" />
        </pattern>
      </defs>

      <rect width="200" height="280" fill={`url(#${id}-bg)`} />
      {renderPattern()}
      <rect width="200" height="280" fill={`url(#${id}-noise)`} opacity="0.6" />

      {showTitle && (
        <>
          <line
            x1="14"
            y1={long ? 200 : 210}
            x2="34"
            y2={long ? 200 : 210}
            stroke={`hsl(0 0% ${l2}%)`}
            strokeWidth="1.5"
          />
          <text
            x="14"
            y={long ? 222 : 232}
            fill={`hsl(0 0% ${Math.min(l2 + 6, 96)}%)`}
            fontSize={long ? "11" : "13"}
            fontWeight="700"
            fontFamily="var(--font-geist-sans), system-ui, sans-serif"
            letterSpacing="-0.02em"
          >
            {wrapTitle(title, long ? 16 : 18).map((line, i) => (
              <tspan key={i} x="14" dy={i === 0 ? 0 : 14}>
                {line}
              </tspan>
            ))}
          </text>
        </>
      )}

      <text
        x="186"
        y="270"
        textAnchor="end"
        fill={`hsl(0 0% ${l2}%)`}
        opacity="0.4"
        fontSize="7"
        fontFamily="var(--font-geist-mono), monospace"
        letterSpacing="0.1em"
      >
        {hash.toUpperCase()}
      </text>
    </svg>
  );
}

function wrapTitle(title: string, maxChars: number): string[] {
  const words = title.split(/\s+/);
  const lines: string[] = [];
  let cur = "";
  for (const w of words) {
    if ((cur + " " + w).trim().length > maxChars) {
      if (cur) lines.push(cur.trim());
      cur = w;
    } else {
      cur = (cur + " " + w).trim();
    }
  }
  if (cur) lines.push(cur.trim());
  return lines.slice(0, 3);
}
