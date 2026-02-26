import { useEffect, useMemo, useState } from "react";

// Data: [country, iso, region, pedestrian_deaths_per_100k, cars_per_1000_people, population_millions]
// Sources: WHO Global Status Report on Road Safety 2023 (pedestrian deaths, 2021 data)
//          World Bank / OICA motor vehicle registrations ~2021
// Pedestrian deaths = estimated pedestrian road traffic deaths per 100,000 population
// Cars per 1000 = passenger cars per 1000 inhabitants

const RAW_DATA = [
  // High-income / Europe
  ["Norway",        "NOR", "Europe",         0.2,  495, 5.4],
  ["Sweden",        "SWE", "Europe",         0.5,  488, 10.4],
  ["Denmark",       "DNK", "Europe",         0.4,  471, 5.9],
  ["Finland",       "FIN", "Europe",         0.5,  548, 5.5],
  ["Switzerland",   "CHE", "Europe",         0.5,  561, 8.7],
  ["Netherlands",   "NLD", "Europe",         0.5,  461, 17.5],
  ["Germany",       "DEU", "Europe",         0.6,  589, 83.2],
  ["Austria",       "AUT", "Europe",         0.6,  576, 9.1],
  ["UK",            "GBR", "Europe",         0.4,  444, 67.5],
  ["Ireland",       "IRL", "Europe",         0.5,  410, 5.1],
  ["France",        "FRA", "Europe",         0.7,  508, 67.5],
  ["Belgium",       "BEL", "Europe",         0.6,  511, 11.5],
  ["Spain",         "ESP", "Europe",         0.6,  530, 47.4],
  ["Portugal",      "PRT", "Europe",         0.9,  461, 10.2],
  ["Italy",         "ITA", "Europe",         0.8,  681, 60.4],
  ["Iceland",       "ISL", "Europe",         0.3,  751, 0.37],
  ["Luxembourg",    "LUX", "Europe",         0.4,  681, 0.65],
  ["Japan",         "JPN", "E. Asia/Pac.",   0.6,  619, 125.7],
  ["South Korea",   "KOR", "E. Asia/Pac.",   1.2,  448, 51.7],
  ["Australia",     "AUS", "E. Asia/Pac.",   0.8,  745, 25.7],
  ["New Zealand",   "NZL", "E. Asia/Pac.",   0.9,  718, 5.1],
  ["Canada",        "CAN", "N. America",     0.9,  653, 38.0],
  ["USA",           "USA", "N. America",     2.0,  816, 332.0],
  ["Israel",        "ISR", "Middle East",    0.9,  367, 9.3],
  ["Singapore",     "SGP", "E. Asia/Pac.",   0.3,  112, 5.9],
  ["Hong Kong",     "HKG", "E. Asia/Pac.",   0.2,   77, 7.5],
  ["Czech Republic","CZE", "Europe",         1.2,  580, 10.7],
  ["Slovakia",      "SVK", "Europe",         0.9,  438, 5.5],
  ["Hungary",       "HUN", "Europe",         1.1,  400, 9.7],
  ["Poland",        "POL", "Europe",         1.6,  598, 38.0],
  ["Slovenia",      "SVN", "Europe",         0.9,  565, 2.1],
  ["Estonia",       "EST", "Europe",         1.1,  513, 1.3],
  ["Latvia",        "LVA", "Europe",         1.8,  404, 1.9],
  ["Lithuania",     "LTU", "Europe",         1.9,  486, 2.8],
  ["Croatia",       "HRV", "Europe",         1.0,  457, 4.0],
  ["Romania",       "ROU", "Europe",         2.3,  338, 19.2],
  ["Bulgaria",      "BGR", "Europe",         1.8,  398, 6.8],
  ["Serbia",        "SRB", "Europe",         1.5,  280, 6.9],
  ["Greece",        "GRC", "Europe",         1.1,  573, 10.7],
  ["Cyprus",        "CYP", "Europe",         0.7,  619, 1.2],
  ["Malta",         "MLT", "Europe",         0.4,  694, 0.52],
  // Upper-middle income
  ["Russia",        "RUS", "Europe",         2.8,  365, 143.4],
  ["Belarus",       "BLR", "Europe",         1.5,  333, 9.4],
  ["Ukraine",       "UKR", "Europe",         1.8,  206, 43.5],
  ["China",         "CHN", "E. Asia/Pac.",   1.8,  199, 1412.0],
  ["Brazil",        "BRA", "Lat. America",   3.6,  219, 214.3],
  ["Mexico",        "MEX", "Lat. America",   1.7,  235, 130.3],
  ["Argentina",     "ARG", "Lat. America",   2.8,  233, 45.6],
  ["Colombia",      "COL", "Lat. America",   3.0,  108, 51.3],
  ["Peru",          "PER", "Lat. America",   3.5,   90, 32.5],
  ["Ecuador",       "ECU", "Lat. America",   4.0,   98, 17.8],
  ["Venezuela",     "VEN", "Lat. America",   2.4,  134, 28.5],
  ["Cuba",          "CUB", "Lat. America",   4.2,   46, 11.3],
  ["Dominican Rep.","DOM", "Lat. America",   5.0,   90, 10.9],
  ["South Africa",  "ZAF", "Sub-Saharan",    8.5,  165, 60.0],
  ["Botswana",      "BWA", "Sub-Saharan",    7.2,  152, 2.6],
  ["Namibia",       "NAM", "Sub-Saharan",    6.0,  120, 2.6],
  ["Gabon",         "GAB", "Sub-Saharan",    5.0,  180, 2.3],
  ["Turkey",        "TUR", "Middle East",    1.8,  250, 85.0],
  ["Iran",          "IRN", "Middle East",    4.5,  168, 85.0],
  ["Jordan",        "JOR", "Middle East",    3.0,  143, 10.3],
  ["Lebanon",       "LBN", "Middle East",    4.5,  420, 6.8],
  ["Tunisia",       "TUN", "N. Africa",      3.5,  110, 11.9],
  ["Morocco",       "MAR", "N. Africa",      3.8,   84, 37.1],
  ["Algeria",       "DZA", "N. Africa",      3.0,   90, 44.6],
  ["Libya",         "LBY", "N. Africa",      5.5,  220, 7.0],
  ["Egypt",         "EGY", "N. Africa",      5.0,   46, 104.0],
  ["Thailand",      "THA", "E. Asia/Pac.",   3.9,  194, 71.6],
  ["Malaysia",      "MYS", "E. Asia/Pac.",   2.5,  406, 33.0],
  ["Indonesia",     "IDN", "E. Asia/Pac.",   3.0,   87, 274.0],
  ["Vietnam",       "VNM", "E. Asia/Pac.",   3.3,   32, 98.0],
  ["Philippines",   "PHL", "E. Asia/Pac.",   3.2,   37, 111.0],
  ["Sri Lanka",     "LKA", "S. Asia",        3.5,   60, 22.2],
  ["Kazakhstan",    "KAZ", "C. Asia",        3.8,  296, 19.0],
  ["Azerbaijan",    "AZE", "C. Asia",        2.8,  155, 10.1],
  ["Armenia",       "ARM", "C. Asia",        2.2,  245, 3.0],
  ["Georgia",       "GEO", "C. Asia",        3.0,  251, 3.7],
  // Lower-middle income
  ["India",         "IND", "S. Asia",        3.5,   22, 1393.0],
  ["Pakistan",      "PAK", "S. Asia",        2.0,   22, 225.2],
  ["Bangladesh",    "BGD", "S. Asia",        3.0,    6, 166.3],
  ["Nepal",         "NPL", "S. Asia",        2.5,   15, 29.6],
  ["Myanmar",       "MMR", "E. Asia/Pac.",   4.0,   25, 54.4],
  ["Cambodia",      "KHM", "E. Asia/Pac.",   5.0,   28, 16.7],
  ["Ghana",         "GHA", "Sub-Saharan",    6.0,   35, 32.4],
  ["Nigeria",       "NGA", "Sub-Saharan",    9.0,   33, 213.4],
  ["Senegal",       "SEN", "Sub-Saharan",    5.5,   30, 17.2],
  ["Cameroon",      "CMR", "Sub-Saharan",    6.5,   21, 27.9],
  ["Côte d'Ivoire", "CIV", "Sub-Saharan",    6.2,   30, 26.9],
  ["Kenya",         "KEN", "Sub-Saharan",    7.5,   25, 54.0],
  ["Tanzania",      "TZA", "Sub-Saharan",    6.0,   18, 62.0],
  ["Uganda",        "UGA", "Sub-Saharan",    7.8,   10, 46.9],
  ["Ethiopia",      "ETH", "Sub-Saharan",    7.0,    9, 120.0],
  ["Sudan",         "SDN", "Sub-Saharan",    5.5,   34, 44.9],
  ["Mozambique",    "MOZ", "Sub-Saharan",    6.5,   14, 32.8],
  ["Zambia",        "ZMB", "Sub-Saharan",    7.2,   18, 18.9],
  ["Zimbabwe",      "ZWE", "Sub-Saharan",    8.0,   24, 15.1],
  ["Madagascar",    "MDG", "Sub-Saharan",    5.5,   11, 27.7],
  ["Bolivia",       "BOL", "Lat. America",   4.5,   82, 11.8],
  ["Honduras",      "HND", "Lat. America",   6.0,   70, 10.3],
  ["Guatemala",     "GTM", "Lat. America",   5.5,   75, 17.1],
  ["Nicaragua",     "NIC", "Lat. America",   4.8,   60, 6.6],
  ["El Salvador",   "SLV", "Lat. America",   4.5,   82, 6.5],
  ["Haiti",         "HTI", "Lat. America",   8.0,   24, 11.4],
  ["Iraq",          "IRQ", "Middle East",    5.0,  108, 41.2],
  ["Yemen",         "YEM", "Middle East",    4.5,   43, 33.7],
  ["Syria",         "SYR", "Middle East",    3.5,   66, 21.3],
  // Low income
  ["Guinea",        "GIN", "Sub-Saharan",   16.0,   14, 13.2],
  ["Central Af. R.","CAF", "Sub-Saharan",   13.0,    8, 4.9],
  ["Chad",          "TCD", "Sub-Saharan",   11.0,   10, 16.9],
  ["Niger",         "NER", "Sub-Saharan",   10.0,    6, 25.1],
  ["Mali",          "MLI", "Sub-Saharan",   10.5,   12, 22.4],
  ["Burkina Faso",  "BFA", "Sub-Saharan",    9.5,   14, 21.5],
  ["Congo DR",      "COD", "Sub-Saharan",    9.0,    8, 95.9],
  ["Somalia",       "SOM", "Sub-Saharan",    8.5,   12, 16.4],
  ["Sierra Leone",  "SLE", "Sub-Saharan",   10.0,   16, 8.1],
  ["Liberia",       "LBR", "Sub-Saharan",    9.5,   14, 5.2],
  ["Togo",          "TGO", "Sub-Saharan",    8.5,   22, 8.3],
  ["Benin",         "BEN", "Sub-Saharan",    8.0,   19, 12.1],
  ["Malawi",        "MWI", "Sub-Saharan",    7.5,    9, 20.0],
  ["Rwanda",        "RWA", "Sub-Saharan",    7.0,    8, 13.5],
  ["Burundi",       "BDI", "Sub-Saharan",    6.8,    5, 12.0],
  ["Afghanistan",   "AFG", "S. Asia",        5.5,   18, 39.8],
];

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

  const margin = { top: 40, right: 30, bottom: 70, left: 70 };
  const width = Math.max(700, viewport.width - 64);
  const height = Math.max(520, Math.min(820, viewport.height - 260));
  const innerW = width - margin.left - margin.right;
  const innerH = height - margin.top - margin.bottom;

  const filteredData = useMemo(
    () => RAW_DATA.filter(d => selectedRegions.has(d[2])),
    [selectedRegions]
  );

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
