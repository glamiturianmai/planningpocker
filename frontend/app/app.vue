<template>
  <NuxtLayout><NuxtPage /></NuxtLayout>
</template>

<style>
:root {
  --ink: #20372d;
  --muted: #718078;
  --accent: #285943;
  --lime: #d9efab;
  --paper: #f6f7f2;
  --line: #e1e7dd;
  --danger: #b64a3d;
  font-family:
    'Avenir Next',
    Avenir,
    -apple-system,
    BlinkMacSystemFont,
    'Segoe UI',
    sans-serif;
  color: var(--ink);
  background: var(--paper);
  font-synthesis: none;
}
* {
  box-sizing: border-box;
}
body {
  margin: 0;
}
button,
input {
  font: inherit;
}
button,
a,
input {
  -webkit-tap-highlight-color: transparent;
}
button {
  cursor: pointer;
}
button:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}
a {
  color: inherit;
}
button,
a,
input {
  outline-offset: 4px;
}
:focus-visible {
  outline: 3px solid #82aa55;
}
h1,
h2,
h3,
p {
  margin: 0;
}
h1,
h2,
h3 {
  letter-spacing: -0.035em;
}
button {
  transition:
    background 0.18s,
    transform 0.18s,
    border-color 0.18s;
}
.button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-height: 44px;
  padding: 11px 18px;
  border: 1px solid transparent;
  border-radius: 12px;
  font-weight: 600;
  text-decoration: none;
}
.button-primary {
  color: white;
  background: var(--accent);
}
.button-primary:hover:not(:disabled) {
  background: #193f2d;
  transform: translateY(-1px);
}
.button-secondary {
  color: var(--ink);
  border-color: var(--line);
  background: white;
}
.button-secondary:hover:not(:disabled) {
  background: #edf1e7;
}
.eyebrow {
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  color: var(--muted);
}
.field {
  display: flex;
  flex-direction: column;
  gap: 8px;
  font-size: 13px;
  font-weight: 600;
}
.field input {
  width: 100%;
  min-height: 48px;
  padding: 12px 14px;
  border: 1px solid var(--line);
  border-radius: 12px;
  background: #fafbf7;
  color: var(--ink);
}
.field input:focus {
  border-color: var(--accent);
}
.field input::placeholder {
  color: #99a199;
  font-weight: 400;
}
.error {
  color: var(--danger);
  font-size: 13px;
  line-height: 1.6;
}
.notice {
  padding: 14px 18px;
  border: 1px solid #cdddba;
  border-radius: 12px;
  background: #eef5e5;
  font-size: 14px;
}
.segmented {
  display: flex;
  gap: 4px;
  padding: 5px;
  background: #edf0e8;
  border-radius: 12px;
}
.segmented button {
  flex: 1;
  padding: 11px;
  border: 0;
  border-radius: 8px;
  background: transparent;
  color: var(--muted);
  font-size: 13px;
  font-weight: 600;
}
.segmented button[aria-pressed='true'] {
  background: white;
  color: var(--ink);
  box-shadow: 0 2px 5px #20372d0a;
}
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
</style>
