interface SimpleBarChartProps {
  data: { date: string; count: number }[];
}

export default function SimpleBarChart({ data }: SimpleBarChartProps) {
  if (data.length === 0) return null;

  const maxCount = Math.max(...data.map((d) => d.count), 1);
  const chartHeight = 200;
  const padding = 40;
  const barSpacing = 8;
  const minBarWidth = 24;
  const maxBarWidth = 48;

  // Calcula largura dinâmica baseada no número de barras
  const availableWidth = 800;
  const calculatedBarWidth = Math.max(
    minBarWidth,
    Math.min(maxBarWidth, (availableWidth - padding * 2) / data.length - barSpacing)
  );

  const chartWidth = Math.max(
    400,
    data.length * (calculatedBarWidth + barSpacing) + padding * 2
  );

  return (
    <div className="overflow-x-auto -mx-2 px-2">
      <svg
        width="100%"
        height={chartHeight}
        viewBox={`0 0 ${chartWidth} ${chartHeight}`}
        className="min-h-[200px]"
        preserveAspectRatio="xMidYMid meet"
      >
        {/* Linha de referência */}
        <line
          x1={padding}
          y1={chartHeight - padding}
          x2={chartWidth - padding}
          y2={chartHeight - padding}
          stroke="var(--border)"
          strokeWidth="1"
        />

        {data.map((item, index) => {
          const barHeight =
            maxCount > 0
              ? (item.count / maxCount) * (chartHeight - padding * 2 - 20)
              : 0;
          const x = index * (calculatedBarWidth + barSpacing) + padding;
          const y = chartHeight - padding - barHeight;

          return (
            <g key={index}>
              <rect
                x={x}
                y={y}
                width={calculatedBarWidth}
                height={barHeight}
                fill="var(--primary)"
                rx={4}
                className="transition-all hover:opacity-80"
                style={{ fill: "var(--primary)" }}
              />
              <text
                x={x + calculatedBarWidth / 2}
                y={chartHeight - padding + 15}
                textAnchor="middle"
                style={{ fill: "var(--muted-foreground)" }}
                fontSize="10"
              >
                {item.date}
              </text>
              {item.count > 0 && (
                <text
                  x={x + calculatedBarWidth / 2}
                  y={y - 5}
                  textAnchor="middle"
                  style={{ fill: "var(--foreground)" }}
                  fontSize="11"
                  fontWeight="500"
                >
                  {item.count}
                </text>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}

