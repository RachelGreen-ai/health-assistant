/**
 * Generate SVG icons for HealthCompanion prototype using Quiver AI
 * Style: modern, sleek, clean, minimal line icons — health app
 */

const API_KEY = process.env.QUIVERAI_API_KEY;
const ENDPOINT = 'https://api.quiver.ai/v1/svgs/generations';

const STYLE = 'minimal thin-stroke line icon, modern health app, clean elegant iOS style, single color currentColor, no fill, 24x24 viewbox';

const ICONS = [
  { name: 'home',        prompt: `house with a simple roof and door, ${STYLE}` },
  { name: 'chat',        prompt: `speech bubble with three small dots inside, ${STYLE}` },
  { name: 'lab',         prompt: `laboratory test tube or beaker with a liquid level line, ${STYLE}` },
  { name: 'calendar',    prompt: `calendar with two binding dots at top and a small date grid, ${STYLE}` },
  { name: 'checklist',   prompt: `clipboard with three horizontal lines and a checkmark on first line, ${STYLE}` },
  { name: 'microphone',  prompt: `microphone with a rounded capsule body and a small stand arc, ${STYLE}` },
  { name: 'pill',        prompt: `capsule pill split diagonally into two halves, ${STYLE}` },
  { name: 'ai-spark',    prompt: `four-pointed sparkle or star with two larger and two smaller points, ${STYLE}` },
  { name: 'send',        prompt: `paper plane pointing top-right, ${STYLE}` },
  { name: 'phone',       prompt: `classic telephone handset, ${STYLE}` },
  { name: 'mail',        prompt: `envelope with a simple V flap line at top, ${STYLE}` },
  { name: 'edit',        prompt: `pencil at 45-degree angle with a small square eraser end, ${STYLE}` },
  { name: 'clock',       prompt: `circle clock face with two hands showing approximately 10:10, ${STYLE}` },
  { name: 'keyboard',    prompt: `keyboard with three rows of small rounded rectangle keys, ${STYLE}` },
];

async function generateIcon(icon) {
  const res = await fetch(ENDPOINT, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'arrow-preview',
      prompt: icon.prompt,
      n: 1,
      stream: false,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`${res.status} for ${icon.name}: ${err}`);
  }

  const data = await res.json();
  return data;
}

const results = {};
let success = 0, failed = 0;

for (const icon of ICONS) {
  process.stdout.write(`Generating ${icon.name}... `);
  try {
    const data = await generateIcon(icon);
    // Extract SVG from response — try common response shapes
    const svg = data?.data?.[0]?.svg
      ?? data?.data?.[0]?.content
      ?? data?.svg
      ?? data?.content
      ?? JSON.stringify(data);
    results[icon.name] = svg;
    console.log('✓');
    success++;
  } catch (e) {
    console.log(`✗ ${e.message}`);
    results[icon.name] = null;
    failed++;
  }
  // Small delay to respect rate limits
  await new Promise(r => setTimeout(r, 200));
}

console.log(`\nDone: ${success} succeeded, ${failed} failed\n`);
console.log('=== ICON RESULTS ===');
for (const [name, svg] of Object.entries(results)) {
  if (svg) {
    console.log(`\n--- ${name} ---`);
    console.log(svg.slice(0, 300));
  }
}

// Output as JS object for embedding in HTML
console.log('\n\n=== JS EXPORT ===');
console.log('export const ICONS = ' + JSON.stringify(results, null, 2));
