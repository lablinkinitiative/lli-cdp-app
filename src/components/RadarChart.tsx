// Simple SVG radar chart — no external library needed

interface RadarChartProps {
  axes: string[];
  studentScores: number[];
  requiredScores: number[];
  size?: number;
}

function polarToCartesian(cx: number, cy: number, r: number, angle: number): [number, number] {
  const rad = (angle - 90) * (Math.PI / 180);
  return [cx + r * Math.cos(rad), cy + r * Math.sin(rad)];
}

function makePolygonPoints(cx: number, cy: number, r: number, scores: number[], totalAxes: number): string {
  const angleStep = 360 / totalAxes;
  return scores.map((score, i) => {
    const [x, y] = polarToCartesian(cx, cy, r * score, i * angleStep);
    return `${x},${y}`;
  }).join(' ');
}

export default function RadarChart({ axes, studentScores, requiredScores, size = 260 }: RadarChartProps) {
  const cx = size / 2;
  const cy = size / 2;
  const r = size * 0.38;
  const n = axes.length;
  const angleStep = 360 / n;
  const rings = [0.25, 0.5, 0.75, 1.0];

  const requiredPts = makePolygonPoints(cx, cy, r, requiredScores, n);
  const studentPts = makePolygonPoints(cx, cy, r, studentScores, n);

  return (
    <div className="radar-container" aria-label="Skills radar chart">
      <svg
        width={size}
        height={size + 40}
        viewBox={`0 0 ${size} ${size + 40}`}
        style={{ overflow: 'visible' }}
        role="img"
        aria-label="Radar chart showing student skills vs required skills"
      >
        {/* Background rings */}
        {rings.map(ring => (
          <polygon
            key={ring}
            points={makePolygonPoints(cx, cy, r, Array(n).fill(ring), n)}
            fill="none"
            stroke="var(--border)"
            strokeWidth="1"
          />
        ))}

        {/* Axis lines */}
        {axes.map((_, i) => {
          const [x, y] = polarToCartesian(cx, cy, r, i * angleStep);
          return <line key={i} x1={cx} y1={cy} x2={x} y2={y} stroke="var(--border)" strokeWidth="1" />;
        })}

        {/* Required polygon */}
        <polygon
          points={requiredPts}
          fill="rgba(74,95,57,0.12)"
          stroke="var(--brand-700)"
          strokeWidth="1.5"
          strokeDasharray="4 2"
        />

        {/* Student polygon */}
        <polygon
          points={studentPts}
          fill="rgba(165,196,58,0.25)"
          stroke="var(--accent-lime)"
          strokeWidth="2"
        />

        {/* Axis labels */}
        {axes.map((axis, i) => {
          const [x, y] = polarToCartesian(cx, cy, r + 22, i * angleStep);
          const textAnchor = x < cx - 10 ? 'end' : x > cx + 10 ? 'start' : 'middle';
          return (
            <text
              key={i}
              x={x}
              y={y}
              textAnchor={textAnchor}
              dominantBaseline="middle"
              fontSize="10"
              fill="var(--text-muted)"
              fontFamily="Plus Jakarta Sans, sans-serif"
              fontWeight="600"
            >
              {axis.length > 16 ? axis.slice(0, 14) + '…' : axis}
            </text>
          );
        })}

        {/* Center dot */}
        <circle cx={cx} cy={cy} r="3" fill="var(--brand-700)" />
      </svg>

      {/* Legend */}
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, display: 'flex', justifyContent: 'center', gap: '1rem', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
          <svg width="20" height="10"><line x1="0" y1="5" x2="20" y2="5" stroke="var(--accent-lime)" strokeWidth="2"/></svg>
          Your Profile
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
          <svg width="20" height="10"><line x1="0" y1="5" x2="20" y2="5" stroke="var(--brand-700)" strokeWidth="1.5" strokeDasharray="4 2"/></svg>
          Required
        </span>
      </div>
    </div>
  );
}
