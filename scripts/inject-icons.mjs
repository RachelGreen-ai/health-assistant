/**
 * Post-processes Quiver SVGs and injects them into the prototype HTML.
 * - Normalizes all hardcoded colors → currentColor
 * - Strips comments and fixed width/height attrs
 * - Replaces emoji instances throughout the HTML
 */

import { readFileSync, writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const HTML_PATH = resolve(__dirname, '../healthcompanion-prototype.html');

// ─── Raw SVGs from Quiver (paths only, viewBox preserved) ─────────────────────
const RAW = {
  home: { vb: '0 0 256 256', d: `<path d="m127.7 4.72h-0.06c-5.17 0-9.11 1.78-11.49 4.66l-103.1 102.7c-6.6 6.34-6.13 16.89 0.56 23.01 3.23 3.01 7.43 4.41 11.56 4.15 5.01-0.3 8.73-2.5 12.35-6.51l-0.05 99.99c0 10.51 8.26 18.59 19 18.59h142.2c10.47 0 18.35-8.82 18.54-17.89l0.34-100.6c4.3 4.6 8.41 6.47 14.69 5.93 8.93-0.78 14.96-8.29 14.64-15.93-0.21-5.01-1.9-8.29-4.04-10.5l-103.1-102.9c-3.48-3.57-6.92-4.66-11.97-4.66zm-0.09 7.15c3.16 0 5.3 1.45 6.85 3.28l102.7 102.2c4.62 4.55 2.7 13-4.31 13.99-3.9 0.55-6.67-0.91-8.94-3.58l-93.21-92.67c-1.9-1.91-3.63-1.91-5.33-0.44l-95.14 94.03c-4.25 4.02-11.05 2.39-13.47-2.86-1.78-4.01-1.08-7.39 1.59-9.76l103.4-101.6c1.78-1.86 3.51-2.67 5.87-2.66zm0.13 31.49 82.29 81.95v107.5c0 7.26-5.32 11.5-11.69 11.32h-38.57v-81.57c0-2.9-1.86-4.69-3.81-4.69h-56.64c-2.4 0-3.75 1.92-3.75 4.51v81.58h-38.83c-7.09 0-10.8-5.25-10.8-11.33l-0.24-107.2 82.04-82.06z" fill="currentColor"/>` },

  chat: { vb: '0 0 47 47', d: `<path d="m23.43 1.21c-12.39 0-22.32 9.95-22.32 21.8 0 5.62 2.97 10.41 7.26 14.04l-2.06 8.74 10.63-4.58c2.07 0.55 4.18 0.92 6.49 0.92 12.39 0 22.33-9.27 22.33-19.12 0-11.24-9.95-22.14-22.33-21.8z" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" fill="none"/><path d="m14.01 26.08c1.58 0 2.69-1.3 2.69-2.58 0-1.44-1.17-2.62-2.64-2.65-1.5 0-2.57 1.29-2.57 2.61 0 1.44 1.14 2.62 2.52 2.62z" fill="currentColor"/><path d="m23.43 26.08c1.57 0 2.61-1.3 2.61-2.58 0-1.44-1.18-2.62-2.65-2.65-1.49 0-2.57 1.29-2.57 2.61 0 1.44 1.14 2.62 2.61 2.62z" fill="currentColor"/><path d="m32.88 26.13c1.57 0 2.51-1.3 2.51-2.58 0-1.44-1.07-2.62-2.54-2.64-1.49 0-2.57 1.29-2.57 2.61 0 1.44 1.13 2.61 2.6 2.61z" fill="currentColor"/>` },

  lab: { vb: '0 0 250 250', d: `<path d="m157.8 5h-64.96c-8.1 0-12.79 6.6-12.79 12.32v0.35c0 7.11 5.06 12.4 10.86 12.81v180.6c0 17.66 14.44 34.09 33.86 34.09h0.13c18.79 0 34.08-15.51 34.08-34.06v-180.8c7.2-0.79 11.07-7.52 11.07-12.89v-0.35c0-6.47-4.93-12.16-12.25-12.16zm-6.97 206.2c0 14.74-11.87 26.76-26.17 26.76h-0.1c-14.13 0-25.95-11.74-25.95-26.92v-103.1h52.22v103.2zm0-111.1h-52.22v-69.32h52.22v69.32zm11.93-82.63c0 3.56-2.33 5.46-5.52 5.46h-63.76c-3.82 0-6.18-2.56-6.14-5.96v-0.2c0-3.01 2.2-5.11 5.31-5.11h64.85c3.16 0 5.26 2.45 5.26 5.31v0.5z" fill="currentColor"/>` },

  calendar: { vb: '0 0 200 200', d: `<path d="m177.3 25.51h-16.15v-3.48c0-7.21-5.33-12.03-11.69-12.03-7.06 0-12.04 5.81-12.04 12.4v3.11h-75.3v-3.48c0-6.95-5.09-12.03-11.56-12.03-7.07 0-12.06 5.48-12.06 12.4v3.11h-16.17c-10.33 0-18.29 9.15-18.29 19.41v125.9c0 10.26 7.95 18.39 18.16 18.39h155.1c10.28 0 19.18-8.5 19.18-18.5v-125.8c0-10.25-8.34-19.4-19.18-19.4zm-32.84-3.24c0-3.68 2.59-6.11 5.3-6.11 3.7 0 4.96 3.13 4.96 5.41v14.41c0 3.3-2.26 5.35-5.24 5.35-3.23 0-5.02-2.7-5.02-5.27v-13.79zm-98.91 0.05c0-3.62 2.7-5.8 4.91-5.8 3.56 0 5.21 2.85 5.21 5.2v14.22c0 3.11-2.3 5.3-5.21 5.3-3.18 0-4.91-2.83-4.91-5.26v-13.66zm-23.15 9.85h16.28v3.89c0 7.29 5.43 11.66 11.59 11.66 7.07 0 11.69-5.61 11.69-11.66l0.09-3.89h75.6v3.89c0 7.27 5.46 11.66 11.7 11.66 6.55 0 11.77-5.18 11.77-11.47l-0.09-4.07h15.93c7.79 0 13.19 6.84 13.19 12.88v12.36l-180.6 0.01v-12.54c0-7.39 5.93-12.72 12.88-12.72zm154.9 150.8h-154.9c-7.41 0-12.84-5.86-12.84-12.63v-105.8l180.6-0.01v105.5c0 7.3-6.14 12.92-12.85 12.92z" fill="currentColor"/>` },

  checklist: { vb: '0 0 250 250', d: `<path d="m191.4 34.44h-27.41v-7.35c0-4.63-3.47-7.68-6.19-7.68h-16.24c-0.84-9.42-8.78-14.63-16.58-14.63-8.09 0-16.24 5.71-17.62 14.63h-16.22c-4.94 0-6.76 4.56-6.76 7.41v7.37h-26.56c-10.11 0-16.99 8.67-16.99 16.46v177c0 9.39 7.42 17.44 17.32 17.44h132.7c10.08 0 17.37-8.25 17.37-17.25v-177c0-9.8-7.99-16.47-16.78-16.47zm-102.4-7.62c0-1.31 0.92-3.04 1.93-3.04h18.69c1.54 0 2.35-1.09 2.35-2.29 0-8.33 7.12-12.89 13-12.89 7.16 0 12.79 6.13 12.79 12.89l-0.08 0.47c-0.25 1.53 0.86 2.53 2.15 2.53h18.43c1.81 0 2.16 1.92 2.16 3.06v18.18c0 1.66-1.09 2.29-2.04 2.29h-67.2c-1.33 0-2.18-1.4-2.18-2.56v-18.64zm114.8 201c0 7.34-6.16 13.03-12.98 13.03h-132.7c-7.7 0-12.95-6.01-12.95-13.22v-177c0-6.8 5.71-12.67 12.62-12.67h26.81v8.03c0 4.65 3.57 6.2 6.12 6.2h67.64c4.83 0 6.44-4.09 6.44-6.51v-7.08h26.57c7.29 0 12.39 6.2 12.39 12.29v177z" fill="currentColor"/><path d="m183.9 103.6h-73.24c-1.74 0-2.23 1.07-2.23 2.08 0 1.32 0.93 2.16 2.02 2.16h73.24c1.75 0 2.23-1.07 2.23-2.08 0-1.33-0.92-2.16-2.02-2.16z" fill="currentColor"/><path d="m183.9 144.5h-118.4c-1.75 0-2.07 1.07-2.07 2.17 0 1.33 0.92 2.16 2.02 2.16h118.4c1.75 0 1.98-1.43 1.98-2.18 0-1.32-0.92-2.15-2.02-2.15z" fill="currentColor"/><path d="m183.9 186.2h-118.4c-1.75 0-2.07 1.16-2.07 2.18 0 1.42 1.09 2.05 2.02 2.05h118.4c1.56 0 1.98-1.03 1.98-2.08 0-1.32-0.92-2.15-2.02-2.15z" fill="currentColor"/><path d="m96.84 89.72-20.23 20.99-9.81-10.1c-1.04-1.08-2.18-0.63-2.83-0.01-0.96 0.91-0.56 2.52 0.15 3.26l11.16 11.3c0.97 0.99 2.47 0.83 3.23-0.07l21.34-22.79c0.94-1.03 0.56-2.41-0.29-3.04-1-0.77-2.06-0.29-2.72 0.46z" fill="currentColor"/>` },

  microphone: { vb: '0 0 18 32', d: `<path d="m8.9 31.38c-0.26 0-0.4-0.15-0.4-0.4v-5.57c-4.69-0.15-8.34-4.12-8.34-8.79v-1.53c0-0.25 0.15-0.4 0.4-0.4s0.4 0.15 0.4 0.4v1.53c0 4.37 3.5 8.09 7.89 8.09 4.44 0 7.95-3.72 7.95-8.09v-1.53c0-0.25 0.15-0.4 0.39-0.4 0.25 0 0.4 0.2 0.4 0.45v1.53c0 4.72-3.75 8.69-8.29 8.79v5.17h4.29c0.25 0 0.4 0.2 0.4 0.4 0 0.25-0.2 0.4-0.4 0.4h-9.28c-0.25 0-0.4-0.2-0.4-0.45 0-0.2 0.2-0.4 0.4-0.35h4.24z" fill="currentColor"/><path d="m8.9 0.56c-3.45 0-5.98 2.97-5.98 6.34v9.57c0 3.32 2.53 6.24 5.98 6.24 3.36 0 5.99-2.92 5.99-6.24v-9.57c0-3.37-2.63-6.34-5.99-6.34zm5.29 15.91c0 3.07-2.37 5.49-5.29 5.49h-0.05c-3.06 0-5.23-2.52-5.23-5.49v-9.57c0-3.02 2.42-5.58 5.28-5.58h0.05c3.01 0 5.24 2.46 5.24 5.58v9.57z" fill="currentColor"/>` },

  pill: { vb: '0 0 192 192', d: `<path d="m103.8 3.11c-9.3 0-17.32 3.53-22.98 9.51l-68.29 67.94c-6.99 6.95-9.99 15.37-9.75 24.19 0.51 16.14 13.45 31.97 32.83 31.83 9.38-0.06 17.3-3.42 23.16-9.78l68.19-68.33c6.65-6.7 9.34-14.71 8.93-23.03-1.01-16.6-13.67-32.33-32.09-32.33zm-47.99 122.4c-5.72 5.56-12.24 8.08-20.16 8.08-15.42 0-29.2-12.46-29.36-28.76-0.1-8.68 3.25-16.16 8.92-21.95l30.93-31.25 41.89 41.89-32.22 31.99zm68.65-68.85-34.22 34.36-41.64-41.79 34.62-34.87c5.92-5.72 12.88-8.03 20.5-8.03 15.67 0 28.96 12.89 29.48 29.25 0.3 8.06-2.89 15.36-8.74 21.08z" fill="currentColor"/>` },

  'ai-spark': { vb: '0 0 250 250', d: `<path d="m125 6.27-20.73 95.76-93.74 20.47 93.74 21.1 20.27 99.67 21.19-99.39 93.74-21.38-94.02-20.19-20.45-96.04z" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="10" fill="none"/>` },

  send: { vb: '0 0 29 25', d: `<path d="m28.51 0.46c-0.11-0.09-0.27-0.11-0.4-0.05l-27.42 10.49c-0.14 0.05-0.22 0.18-0.22 0.32-0.01 0.14 0.07 0.27 0.19 0.34l6.71 3.73 1.95 9c0.03 0.14 0.12 0.25 0.26 0.29 0.13 0.03 0.28-0.01 0.37-0.11l5.03-4.63 6.56 3.74c0.1 0.05 0.22 0.06 0.33 0.02 0.1-0.04 0.18-0.13 0.21-0.24l6.5-22.53c0.04-0.13 0-0.27-0.07-0.37zm-2.63 1.57-18.2 12.63-6.17-3.4 24.37-9.23zm-17.82 13.18 17.13-11.83-13.82 13.81-0.02 0.03c-0.04 0.05-0.07 0.1-0.09 0.16l-1.55 5.25-1.65-7.42zm2.26 7.93 1.5-5.15 2.6 1.48-4.1 3.67zm11.15-0.44-9.3-5.32 15.34-15.49-6.04 20.81z" fill="currentColor"/>` },

  phone: { vb: '0 0 222 222', d: `<path d="m194.2 170.9-11.25-11.18 5.97-6.21c6.66-6.46 5.67-15.49-0.02-20.54l-24.16-24.32c-6.04-6.05-14.66-5.01-19.86 0.48l-11.2 11.68c-3.49 3.12-8.01 2.39-10.53 0.57-16.51-10.78-30.27-25.31-43.18-44.63-2.24-3.59-2.84-7.82 0.45-11.66l10.64-11.91c6-6.04 5.08-15.18-0.46-20.35l-24.16-25.06c-6.06-6.07-14.06-5.27-19.43 0.73l-7.06 7.57c-12.07 12.3-16.63 28.41-12.16 43.06 11.93 38.63 58.39 94.93 106.9 111.4 15.01 5.52 29.48 2.53 42.62-6.3l11.51 11.46c5.82 5.56 7.78 13.02 6.97 19.33-1.02 8.32-7.14 16.32-20.43 16.32h-48.76c-4.57-0.3-4.57 6.47 0 6.27h48.83c16.49 0 24.55-10.15 26.84-20.3 1.72-9.48-1.95-20.08-7.99-26.88z" fill="currentColor"/>` },

  mail: { vb: '0 0 42 27', d: `<path d="m39.4 0h-36.77c-1.19 0-1.92 1.15-1.92 2.22v22.56c0 1.23 1 2.15 1.92 2.15h36.74c1.22 0 1.92-1.11 1.92-2.12v-22.59c0-1.25-0.81-2.22-1.89-2.22zm-0.28 0.89-18.16 14.04-18.18-14.04h36.34zm0.26 25.14h-36.75c-0.66 0-1.08-0.62-1.08-1.25v-22.56c0-0.36 0.12-0.73 0.33-0.91l18.77 14.58c0.14 0.11 0.32 0.11 0.46 0l18.92-14.55c0.21 0.18 0.31 0.52 0.31 0.88v22.59c0 0.67-0.48 1.22-0.96 1.22z" fill="currentColor"/>` },

  edit: { vb: '0 0 41 41', d: `<path d="m39.61 4.51-3.14-3.12c-0.99-0.98-2.66-0.95-3.58 0.03l-29.18 29.24c-0.1 0.1-0.17 0.22-0.21 0.34l-2.72 8.34c-0.11 0.33-0.02 0.66 0.24 0.88 0.16 0.13 0.35 0.19 0.55 0.19 0.1 0 0.19-0.02 0.29-0.06l8.16-2.97c0.13-0.05 0.24-0.13 0.34-0.22l29.23-29.23c1.02-1.04 1-2.5 0.02-3.42zm-36.85 33.46 2.01-5.2 3.46 3.46-5.47 1.74zm7-2.63-4.19-4.19 23.58-23.55 4.11 4.12-23.5 23.62zm28.65-28.51-3.95 3.78-4.19-4.11 3.94-3.99c0.35-0.35 0.88-0.32 1.19 0l3.03 3.11c0.35 0.34 0.35 0.82-0.02 1.21z" fill="currentColor"/>` },

  clock: { vb: '0 0 256 256', d: `<path d="m127.8 2.94c-68.34 0-124.3 55.96-124.3 125.1 0 68.35 55.44 124.8 124.3 124.8 68.44 0 125.2-56.04 125.2-124.8 0-68.82-56.19-125.1-125.2-125.1zm0 247.1c-67.79 0-121.4-54.38-121.4-121.9 0-67.61 53.56-122.3 121.4-122.3 67.42 0 122.3 54.81 122.3 122.3 0 67.24-55.2 121.9-122.3 121.9z" fill="currentColor"/><path d="m188 66.07-60.01 60.39-39.91-40.39c-0.68-0.69-1.4-0.76-2.01-0.23-0.68 0.6-0.45 1.62 0.15 2.23l40.71 40.5-11 11.09c-0.65 0.72-0.31 2.01 0.79 2.01 0.42 0 0.73-0.15 1.04-0.46l10.85-11.25 10.42 10.83c0.31 0.31 0.63 0.46 1.04 0.46 0.89 0 1.56-1.16 0.51-2.28l-10.85-11.24 60.01-59.64c1.18-1.21-0.35-3.22-1.74-2.02z" fill="currentColor"/>` },

  keyboard: { vb: '0 0 250 250', d: `<path d="m234.2 52h-218.7c-7.59 0-11.91 7.81-11.91 12.91v119.9c0 7.56 5.87 11.96 11.72 11.96h218.8c7.54 0 12.27-6.81 12.27-11.95v-120.4c0-7.97-5.69-12.41-12.19-12.41z" stroke="currentColor" stroke-width="4" fill="none"/><path d="m32.9 68.3h-7.88c-4.08 0-6.08 3.42-6.08 6.29v18.37c0 4.18 3.13 6 6.02 6h7.44c5.16 0 6.06-3.68 6.06-5.79v-18.46c0-4.04-2.95-6.41-5.56-6.41z" stroke="currentColor" stroke-width="4" fill="none"/><path d="m61.71 68.3h-7.04c-4.22 0-6.13 3.79-6.13 6.74v17.57c0 4.4 3.13 6.35 5.93 6.35h7.1c4.59 0 5.72-3.49 5.72-6.06v-18.19c0-4.26-2.9-6.41-5.58-6.41z" stroke="currentColor" stroke-width="4" fill="none"/><path d="m114.1 68.3h-7.04c-3.62 0-4.86 3.93-4.86 6.03v18.54c0 3.84 3.01 6.09 5.31 6.09h6.73c4.11 0 5.48-2.89 5.48-5.43v-18.64c0-4.08-2.53-6.59-5.62-6.59z" stroke="currentColor" stroke-width="4" fill="none"/><path d="m166.6 151.2h-77.9c-3.96 0-5.84 3.88-5.84 6.12v17.72c0 3.7 2.74 5.87 5.17 5.87h78.41c3.92 0 5.42-3.47 5.42-5.67v-17.78c0-3.53-2.21-6.26-5.26-6.26z" stroke="currentColor" stroke-width="4" fill="none"/>` },
};

// ─── Build inline SVG strings at two sizes ────────────────────────────────────
function svg(name, size = 20) {
  const r = RAW[name];
  return `<svg width="${size}" height="${size}" viewBox="${r.vb}" fill="none" xmlns="http://www.w3.org/2000/svg" style="display:inline-block;vertical-align:middle;flex-shrink:0">${r.d}</svg>`;
}

// ─── Read HTML ─────────────────────────────────────────────────────────────────
let html = readFileSync(HTML_PATH, 'utf8');

// ─── Tab bar icons (appear on every screen, 22px) ─────────────────────────────
html = html.replaceAll('<span class="tab-icon">🏠</span>', `<span class="tab-icon">${svg('home', 22)}</span>`);
html = html.replaceAll('<span class="tab-icon">💬</span>', `<span class="tab-icon">${svg('chat', 22)}</span>`);
html = html.replaceAll('<span class="tab-icon">🧪</span>', `<span class="tab-icon">${svg('lab', 22)}</span>`);
html = html.replaceAll('<span class="tab-icon">📅</span>', `<span class="tab-icon">${svg('calendar', 22)}</span>`);
html = html.replaceAll('<span class="tab-icon">📋</span>', `<span class="tab-icon">${svg('checklist', 22)}</span>`);

// ─── Alert icons on home screen (24px) ────────────────────────────────────────
html = html.replace('<div class="alert-icon">📅</div>', `<div class="alert-icon">${svg('calendar', 24)}</div>`);
html = html.replace('<div class="alert-icon">🧪</div>', `<div class="alert-icon">${svg('lab', 24)}</div>`);
html = html.replace('<div class="alert-icon">💊</div>', `<div class="alert-icon">${svg('pill', 24)}</div>`);

// ─── CTA buttons on home (16px inline) ────────────────────────────────────────
html = html.replace('>🎙️ Voice<', `>${svg('microphone', 16)} Voice<`);
html = html.replace('>⌨️ Type<', `>${svg('keyboard', 16)} Type<`);

// ─── AI icon (sparkle, 18px) ──────────────────────────────────────────────────
// Header badge
html = html.replaceAll('<span style="font-size:18px">🤖</span>',
  `<span style="display:inline-flex;align-items:center">${svg('ai-spark', 18)}</span>`);
// AI card headers
html = html.replace('>🤖 HealthCompanion Analysis<', `>${svg('ai-spark', 16)} HealthCompanion Analysis<`);
html = html.replace('>🤖 AI Insight<', `>${svg('ai-spark', 16)} AI Insight<`);
html = html.replace('>🤖 AI-Generated Checklist<', `>${svg('ai-spark', 16)} AI-Generated Checklist<`);
html = html.replace('🤖 AI-Drafted — please review', `${svg('ai-spark', 13)} AI-Drafted — please review`);
// Voice screen AI avatar
html = html.replace('>🤖</div>', `>${svg('ai-spark', 18)}</div>`);

// ─── Microphone in chat input + voice screen ──────────────────────────────────
html = html.replace('<div class="input-icon">🎙️</div>', `<div class="input-icon">${svg('microphone', 18)}</div>`);
html = html.replace('<div class="mic-btn">🎙️</div>', `<div class="mic-btn">${svg('microphone', 32)}</div>`);
html = html.replace('>🎙️ Transcribing…<', `>${svg('microphone', 14)} Transcribing…<`);

// ─── Button labels ─────────────────────────────────────────────────────────────
html = html.replaceAll('>✉️ Draft Message<', `>${svg('mail', 14)} Draft Message<`);
html = html.replaceAll('>✉️ Draft Question<', `>${svg('mail', 14)} Draft Question<`);
html = html.replaceAll('>✉️ Draft as Message<', `>${svg('mail', 13)} Draft as Message<`);
html = html.replaceAll('>✉️ Draft Doctor Message<', `>${svg('mail', 14)} Draft Doctor Message<`);
html = html.replaceAll('>✉️ Send Reschedule Request<', `>${svg('send', 14)} Send Reschedule Request<`);
html = html.replaceAll('>📤 Send via Patient Portal<', `>${svg('send', 14)} Send via Patient Portal<`);
html = html.replaceAll('>📞 On-Call<', `>${svg('phone', 14)} On-Call<`);
html = html.replaceAll('>📞 Call to Reschedule:', `>${svg('phone', 14)} Call to Reschedule:`);
html = html.replaceAll('>📞 Call On-Call Doctor<', `>${svg('phone', 14)} Call On-Call Doctor<`);
html = html.replaceAll('>📞 Call<', `>${svg('phone', 13)} Call<`);
html = html.replaceAll('>💬 Msg<', `>${svg('chat', 13)} Msg<`);
html = html.replaceAll('>📋 Add to Checklist<', `>${svg('checklist', 14)} Add to Checklist<`);
html = html.replaceAll('>📋 Copy<', `>${svg('checklist', 14)} Copy<`);
html = html.replaceAll('>📋 Analyzing image + your records…<', `>${svg('checklist', 14)} Analyzing image + your records…<`);
html = html.replaceAll('>📝 Edit<', `>${svg('edit', 13)} Edit<`);
html = html.replaceAll('>⏰ Set Reminder<', `>${svg('clock', 14)} Set Reminder<`);

// ─── Appointment meta date icons ──────────────────────────────────────────────
html = html.replaceAll('>📅 Apr', `>${svg('calendar', 13)} Apr`);
html = html.replaceAll('>📅 May', `>${svg('calendar', 13)} May`);
html = html.replaceAll('>📅 Earlier slot available<', `>${svg('calendar', 13)} Earlier slot available<`);

// ─── Prep screen appointment badge ────────────────────────────────────────────
html = html.replace('<span style="font-size:24px">📅</span>',
  `<span style="display:inline-flex;align-items:center">${svg('calendar', 24)}</span>`);

// ─── Write updated HTML ────────────────────────────────────────────────────────
writeFileSync(HTML_PATH, html, 'utf8');
console.log('✓ Icons injected into healthcompanion-prototype.html');
