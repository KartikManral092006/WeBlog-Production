export function generateTitlePreviewImage(title: string): string {
  const safeTitle = title?.trim() || "Untitled";

  const palettes = [
    ["#0f172a", "#1d4ed8"],
    ["#3f1d2e", "#c026d3"],
    ["#1f2937", "#0891b2"],
    ["#111827", "#f59e0b"],
    ["#0f172a", "#10b981"],
  ];

  const hash = Array.from(safeTitle).reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const [start, end] = palettes[hash % palettes.length];

  const words = safeTitle.split(/\s+/).slice(0, 7);
  const lineOne = words.slice(0, 4).join(" ");
  const lineTwo = words.slice(4).join(" ");

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
      <defs>
        <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="${start}"/>
          <stop offset="100%" stop-color="${end}"/>
        </linearGradient>
      </defs>
      <rect width="1200" height="630" fill="url(#g)"/>
      <circle cx="1030" cy="120" r="120" fill="rgba(255,255,255,0.1)"/>
      <circle cx="150" cy="510" r="160" fill="rgba(255,255,255,0.08)"/>
      <text x="80" y="280" fill="#ffffff" font-family="Inter, Arial, sans-serif" font-size="66" font-weight="700">${escapeXml(
        lineOne || safeTitle
      )}</text>
      <text x="80" y="360" fill="#ffffff" font-family="Inter, Arial, sans-serif" font-size="52" font-weight="500">${escapeXml(
        lineTwo
      )}</text>
    </svg>
  `;

  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

function escapeXml(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&apos;");
}
