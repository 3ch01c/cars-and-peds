import { useEffect, useMemo, useState } from "react";

// Data rows are loaded from public/data.json.
// Format: [country, iso, region, pedestrian_deaths_per_100k, cars_per_1000_people, population_millions]
// Sources: WHO Global Status Report on Road Safety 2023 (pedestrian deaths, 2021 data)
//          World Bank / OICA motor vehicle registrations ~2021
const DATA_URL = import.meta.env.BASE_URL + "data.json";

const REGION_COLORS = {
  "Europe":        "#4E91E0",
  "N. America":    "#F28A30",
  "Lat. America":  "#E05C5C",
  "E. Asia/Pac.":  "#56C49A",
  "S. Asia":       "#B07FE0",
  "Sub-Saharan":   "#E0A040",
  "Middle East":   "#E06090",
  "N. Africa":     "#80C0D0",
  "C. Asia":       "#90D060",
};

const REGIONS = Object.keys(REGION_COLORS);

export default function PedestrianDeathsChart() {
  const [data, setData] = useState([]);
  const [dataError, setDataError] = useState(null);
  const [hoveredPoint, setHoveredPoint] = useState(null);
  const [selectedRegions, setSelectedRegions] = useState(new Set(REGIONS));
  const [tooltip, setTooltip] = useState(null);
  const [scaleX, setScaleX] = useState("log");
  const [scaleY, setScaleY] = useState("linear");
  const [viewport, setViewport] = useState(() => ({
    width: typeof window !== "undefined" ? window.innerWidth : 1200,
    height: typeof window !== "undefined" ? window.innerHeight : 800,
  }));

  useEffect(() => {
    function onResize() {
      setViewport({ width: window.innerWidth, height: window.innerHeight });
    }
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadData() {
      try {
        setDataError(null);
        const res = await fetch(DATA_URL);
        if (!res.ok) {
          throw new Error(`Failed to load data (${res.status})`);
        }
        const json = await res.json();
        if (!cancelled) {
          setData(Array.isArray(json) ? json : []);
        }
      } catch (err) {
        if (!cancelled) {
          setData([]);
          setDataError(err instanceof Error ? err.message : "Failed to load data");
        }
      }
    }

    loadData();
    return () => {
      cancelled = true;
    };
  }, []);

  const margin = { top: 40, right: 30, bottom: 70, left: 70 };
  const width = Math.max(700, viewport.width - 64);
  const height = Math.max(520, Math.min(820, viewport.height - 260));
  const innerW = width - margin.left - margin.right;
  const innerH = height - margin.top - margin.bottom;

  const filteredData = useMemo(
    () => data.filter(d => selectedRegions.has(d[2])),
    [data, selectedRegions]
  );
  const isDataLoading = data.length === 0 && !dataError;

  // Scale helpers
  const xMin = 5, xMax = 900;
  const yMin = 0.1, yMax = 18;

  function xScale(val) {
    if (scaleX === "log") {
      return (Math.log10(val) - Math.log10(xMin)) / (Math.log10(xMax) - Math.log10(xMin)) * innerW;
    }
    return (val - xMin) / (xMax - xMin) * innerW;
  }

  function yScale(val) {
    if (scaleY === "log") {
      return innerH - (Math.log10(val) - Math.log10(yMin)) / (Math.log10(yMax) - Math.log10(yMin)) * innerH;
    }
    return innerH - (val - 0) / (yMax - 0) * innerH;
  }

  // Grid lines
  const xTicks = scaleX === "log"
    ? [5, 10, 20, 50, 100, 200, 500, 900]
    : [0, 100, 200, 300, 400, 500, 600, 700, 800, 900];
  const yTicks = scaleY === "log"
    ? [0.1, 0.2, 0.5, 1, 2, 5, 10, 18]
    : [0, 2, 4, 6, 8, 10, 12, 14, 16, 18];

  function toggleRegion(r) {
    setSelectedRegions(prev => {
      const next = new Set(prev);
      if (next.has(r)) { next.delete(r); } else { next.add(r); }
      return next;
    });
  }

  function toggleAll() {
    if (selectedRegions.size === REGIONS.length) setSelectedRegions(new Set());
    else setSelectedRegions(new Set(REGIONS));
  }

  return (
    <div style={{
      background: "#0d1117",
      minHeight: "100vh",
      fontFamily: "'DM Mono', 'Courier New', monospace",
      color: "#c9d1d9",
      padding: "24px",
      display: "flex",
      flexDirection: "column",
      alignItems: "stretch",
    }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Mono:wght@300;400;500&family=Space+Grotesk:wght@600;700&display=swap" rel="stylesheet" />

      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: "20px", maxWidth: 860, alignSelf: "center" }}>
        <div style={{ fontSize: "11px", letterSpacing: "3px", color: "#6e7681", marginBottom: 6, textTransform: "uppercase" }}>
          WHO Global Status Report on Road Safety 2023 · World Bank Motor Vehicle Data
        </div>
        <h1 style={{
          fontFamily: "'Space Grotesk', sans-serif",
          fontSize: "26px",
          fontWeight: 700,
          margin: 0,
          color: "#e6edf3",
          letterSpacing: "-0.5px"
        }}>
          Pedestrian Deaths vs. Car Ownership by Country (2021)
        </h1>
        <p style={{ fontSize: "13px", color: "#8b949e", margin: "8px 0 0", lineHeight: 1.5 }}>
          Pedestrian road traffic deaths per 100,000 population vs. passenger cars per 1,000 inhabitants.
          Point size scales with population. Hover for details.
        </p>
      </div>

      {/* Controls row */}
      <div style={{ display: "flex", gap: 12, marginBottom: 14, flexWrap: "wrap", justifyContent: "center", alignItems: "center" }}>
        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
          <span style={{ fontSize: "11px", color: "#6e7681", letterSpacing: "1px" }}>X-AXIS</span>
          {["linear", "log"].map(s => (
            <button key={s} onClick={() => setScaleX(s)} style={{
              padding: "3px 10px", borderRadius: 4, border: "1px solid",
              borderColor: scaleX === s ? "#58a6ff" : "#30363d",
              background: scaleX === s ? "#1a3a5c" : "transparent",
              color: scaleX === s ? "#58a6ff" : "#8b949e",
              fontSize: "11px", cursor: "pointer", fontFamily: "inherit"
            }}>{s}</button>
          ))}
        </div>
        <div style={{ width: 1, height: 20, background: "#30363d" }} />
        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
          <span style={{ fontSize: "11px", color: "#6e7681", letterSpacing: "1px" }}>Y-AXIS</span>
          {["linear", "log"].map(s => (
            <button key={s} onClick={() => setScaleY(s)} style={{
              padding: "3px 10px", borderRadius: 4, border: "1px solid",
              borderColor: scaleY === s ? "#58a6ff" : "#30363d",
              background: scaleY === s ? "#1a3a5c" : "transparent",
              color: scaleY === s ? "#58a6ff" : "#8b949e",
              fontSize: "11px", cursor: "pointer", fontFamily: "inherit"
            }}>{s}</button>
          ))}
        </div>
      </div>

      {/* Region filters */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, justifyContent: "center", marginBottom: 16, maxWidth: 900, alignSelf: "center" }}>
        <button onClick={toggleAll} style={{
          padding: "3px 10px", borderRadius: 4, border: "1px solid #444",
          background: "transparent", color: "#8b949e", fontSize: "11px", cursor: "pointer", fontFamily: "inherit"
        }}>
          {selectedRegions.size === REGIONS.length ? "Deselect All" : "Select All"}
        </button>
        {REGIONS.map(r => (
          <button key={r} onClick={() => toggleRegion(r)} style={{
            padding: "3px 10px", borderRadius: 4, border: "1px solid",
            borderColor: selectedRegions.has(r) ? REGION_COLORS[r] : "#30363d",
            background: selectedRegions.has(r) ? REGION_COLORS[r] + "22" : "transparent",
            color: selectedRegions.has(r) ? REGION_COLORS[r] : "#555",
            fontSize: "11px", cursor: "pointer", fontFamily: "inherit",
            transition: "all 0.15s"
          }}>
            {r}
          </button>
        ))}
      </div>

      {(isDataLoading || dataError) && (
        <div style={{ marginBottom: 12, fontSize: "12px", color: dataError ? "#ff7b72" : "#8b949e", alignSelf: "center" }}>
          {dataError ? `Data load error: ${dataError}` : "Loading chart data..."}
        </div>
      )}

      {/* SVG Chart */}
      <div style={{ position: "relative", background: "#161b22", borderRadius: 12, border: "1px solid #21262d", padding: 8, width: "100%" }}>
        <svg width={width} height={height} style={{ display: "block", overflow: "visible", width: "100%", height: "auto" }}>
          <defs>
            <clipPath id="chartClip">
              <rect x={0} y={0} width={innerW} height={innerH} />
            </clipPath>
          </defs>
          <g transform={`translate(${margin.left},${margin.top})`}>

            {/* Grid lines */}
            {xTicks.map(v => (
              <line key={v} x1={xScale(v)} x2={xScale(v)} y1={0} y2={innerH}
                stroke="#21262d" strokeWidth={1} />
            ))}
            {yTicks.map(v => (
              <line key={v} x1={0} x2={innerW} y1={yScale(v)} y2={yScale(v)}
                stroke="#21262d" strokeWidth={1} />
            ))}

            {/* Axes ticks */}
            {xTicks.map(v => (
              <text key={v} x={xScale(v)} y={innerH + 18} textAnchor="middle"
                fill="#6e7681" fontSize={11} fontFamily="inherit">{v}</text>
            ))}
            {yTicks.filter(v => v > 0).map(v => (
              <text key={v} x={-10} y={yScale(v) + 4} textAnchor="end"
                fill="#6e7681" fontSize={11} fontFamily="inherit">{v}</text>
            ))}

            {/* Axis labels */}
            <text x={innerW / 2} y={innerH + 50} textAnchor="middle"
              fill="#8b949e" fontSize={12} fontFamily="inherit">
              Passenger cars per 1,000 inhabitants (World Bank)
            </text>
            <text transform={`translate(-50,${innerH / 2}) rotate(-90)`} textAnchor="middle"
              fill="#8b949e" fontSize={12} fontFamily="inherit">
              Pedestrian deaths per 100,000 pop. (WHO)
            </text>

            {/* Data points */}
            <g clipPath="url(#chartClip)">
              {filteredData.map(d => {
                const [name, iso, region, deaths, cars, pop] = d;
                const cx = xScale(cars);
                const cy = yScale(deaths);
                const r = Math.max(4, Math.min(18, Math.sqrt(pop) * 0.9));
                const isHovered = hoveredPoint === iso;
                return (
                  <g key={iso}>
                    <circle
                      cx={cx} cy={cy} r={isHovered ? r + 3 : r}
                      fill={REGION_COLORS[region]}
                      fillOpacity={isHovered ? 0.95 : 0.65}
                      stroke={isHovered ? "#fff" : REGION_COLORS[region]}
                      strokeWidth={isHovered ? 2 : 0.8}
                      strokeOpacity={0.8}
                      style={{ cursor: "pointer", transition: "all 0.1s" }}
                      onMouseEnter={(e) => {
                        setHoveredPoint(iso);
                        setTooltip({ name, region, deaths, cars, pop, x: cx, y: cy });
                      }}
                      onMouseLeave={() => { setHoveredPoint(null); setTooltip(null); }}
                    />
                    {(pop > 60 || isHovered) && (
                      <text x={cx} y={cy - r - 4} textAnchor="middle"
                        fill={isHovered ? "#fff" : REGION_COLORS[region]}
                        fontSize={isHovered ? 12 : 9.5}
                        fontFamily="inherit"
                        style={{ pointerEvents: "none", fontWeight: isHovered ? 600 : 400 }}>
                        {name}
                      </text>
                    )}
                  </g>
                );
              })}
            </g>

            {/* Axis lines */}
            <line x1={0} y1={innerH} x2={innerW} y2={innerH} stroke="#444" strokeWidth={1} />
            <line x1={0} y1={0} x2={0} y2={innerH} stroke="#444" strokeWidth={1} />
          </g>
        </svg>

        {/* Tooltip */}
        {tooltip && (
          <div style={{
            position: "absolute",
            left: tooltip.x + margin.left + 14,
            top: tooltip.y + margin.top - 10,
            background: "#1c2128",
            border: `1px solid ${REGION_COLORS[tooltip.region]}`,
            borderRadius: 8,
            padding: "10px 14px",
            fontSize: "12px",
            pointerEvents: "none",
            zIndex: 10,
            boxShadow: "0 4px 24px rgba(0,0,0,0.6)",
            minWidth: 200,
          }}>
            <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 14, color: "#e6edf3", marginBottom: 6 }}>
              {tooltip.name}
            </div>
            <div style={{ color: REGION_COLORS[tooltip.region], fontSize: 11, marginBottom: 8, letterSpacing: "0.5px" }}>
              {tooltip.region}
            </div>
            <table style={{ borderSpacing: "0 3px", width: "100%" }}>
              <tbody>
                <tr>
                  <td style={{ color: "#8b949e", paddingRight: 8 }}>Pedestrian deaths</td>
                  <td style={{ color: "#e6edf3", fontWeight: 500 }}>{tooltip.deaths} / 100k</td>
                </tr>
                <tr>
                  <td style={{ color: "#8b949e", paddingRight: 8 }}>Cars per 1,000</td>
                  <td style={{ color: "#e6edf3", fontWeight: 500 }}>{tooltip.cars}</td>
                </tr>
                <tr>
                  <td style={{ color: "#8b949e", paddingRight: 8 }}>Population</td>
                  <td style={{ color: "#e6edf3", fontWeight: 500 }}>{tooltip.pop}M</td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Key insight callouts */}
      <div style={{ display: "flex", gap: 12, marginTop: 18, flexWrap: "wrap", justifyContent: "center", maxWidth: 860, alignSelf: "center" }}>
        {[
          { color: "#E0A040", text: "Sub-Saharan Africa has the highest pedestrian death rates (6–16 per 100k) despite very low car ownership." },
          { color: "#4E91E0", text: "Europe shows low pedestrian deaths (0.3–2.3) across a wide range of car ownership levels." },
          { color: "#F28A30", text: "USA is an outlier among wealthy nations: high car ownership and relatively high pedestrian deaths (2.0)." },
        ].map((item, i) => (
          <div key={i} style={{
            background: "#161b22", border: `1px solid ${item.color}44`,
            borderLeft: `3px solid ${item.color}`,
            borderRadius: 6, padding: "8px 12px",
            fontSize: "12px", color: "#8b949e", flex: "1 1 220px", lineHeight: 1.5
          }}>
            {item.text}
          </div>
        ))}
      </div>

      {/* Footer */}
      <div style={{ marginTop: 16, fontSize: "11px", color: "#444", textAlign: "center", alignSelf: "center" }}>
        Sources: WHO Global Status Report on Road Safety 2023 · World Bank / OICA Vehicle Registrations ~2021
        <br/>Note: Some pedestrian death figures are WHO estimates. Car ownership data from nearest available year.
      </div>
    </div>
  );
}
