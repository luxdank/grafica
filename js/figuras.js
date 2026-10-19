/* Copia em memoria dos SVGs de img/materiais, usada como data: URL para
   o canvas do orcamento poder ser exportado como PNG. */
var FIGURAS = {
  "m1.svg": `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96" width="96" height="96" role="img" aria-label="Banner 280gr">
<defs>
<linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#F6ECDD"/><stop offset="1" stop-color="#EBD7BE"/></linearGradient>
<linearGradient id="gl" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FFFFFF" stop-opacity="0.7"/><stop offset="0.55" stop-color="#FFFFFF" stop-opacity="0.05"/><stop offset="1" stop-color="#FFFFFF" stop-opacity="0.35"/></linearGradient>
<filter id="sh" x="-30%" y="-30%" width="160%" height="160%"><feDropShadow dx="0" dy="2" stdDeviation="2" flood-color="#3A2413" flood-opacity="0.22"/></filter>
</defs>
<rect width="96" height="96" fill="url(#bg)"/>
<g filter="url(#sh)">
  <rect x="9" y="22" width="78" height="52" rx="3" fill="#C89A6B" stroke="#B06B3A"/>
  <rect x="9" y="22" width="78" height="9" fill="#6B3A1E"/>
  <rect x="9" y="65" width="78" height="9" fill="#6B3A1E"/>
  <path d="M9 22h78v52H9z" fill="url(#gl)"/>
  <circle cx="17" cy="26.5" r="2.4" fill="#E4D9C5" stroke="#6B3A1E"/>
  <circle cx="79" cy="26.5" r="2.4" fill="#E4D9C5" stroke="#6B3A1E"/>
  <circle cx="17" cy="69.5" r="2.4" fill="#E4D9C5" stroke="#6B3A1E"/>
  <circle cx="79" cy="69.5" r="2.4" fill="#E4D9C5" stroke="#6B3A1E"/>
  <text x="48" y="53" font-family="Segoe UI,Arial" font-size="13" font-weight="800" fill="#FFFFFF" text-anchor="middle">280g</text>
</g>
</svg>`,
  "m2.svg": `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96" width="96" height="96" role="img" aria-label="Banner 440gr">
<defs>
<linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#F6ECDD"/><stop offset="1" stop-color="#EBD7BE"/></linearGradient>
<linearGradient id="gl" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FFFFFF" stop-opacity="0.7"/><stop offset="0.55" stop-color="#FFFFFF" stop-opacity="0.05"/><stop offset="1" stop-color="#FFFFFF" stop-opacity="0.35"/></linearGradient>
<filter id="sh" x="-30%" y="-30%" width="160%" height="160%"><feDropShadow dx="0" dy="2" stdDeviation="2" flood-color="#3A2413" flood-opacity="0.22"/></filter>
</defs>
<rect width="96" height="96" fill="url(#bg)"/>
<g filter="url(#sh)">
  <rect x="9" y="22" width="78" height="52" rx="3" fill="#B06B3A" stroke="#6B3A1E"/>
  <rect x="9" y="22" width="78" height="9" fill="#3A2413"/>
  <rect x="9" y="65" width="78" height="9" fill="#3A2413"/>
  <path d="M9 22h78v52H9z" fill="url(#gl)"/>
  <circle cx="17" cy="26.5" r="2.4" fill="#E4D9C5" stroke="#6B3A1E"/>
  <circle cx="79" cy="26.5" r="2.4" fill="#E4D9C5" stroke="#6B3A1E"/>
  <circle cx="17" cy="69.5" r="2.4" fill="#E4D9C5" stroke="#6B3A1E"/>
  <circle cx="79" cy="69.5" r="2.4" fill="#E4D9C5" stroke="#6B3A1E"/>
  <text x="48" y="53" font-family="Segoe UI,Arial" font-size="13" font-weight="800" fill="#FFFFFF" text-anchor="middle">440g</text>
</g>
</svg>`,
  "m3.svg": `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96" width="96" height="96" role="img" aria-label="Adesivo redondo">
<defs>
<linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#F6ECDD"/><stop offset="1" stop-color="#EBD7BE"/></linearGradient>
<linearGradient id="gl" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FFFFFF" stop-opacity="0.7"/><stop offset="0.55" stop-color="#FFFFFF" stop-opacity="0.05"/><stop offset="1" stop-color="#FFFFFF" stop-opacity="0.35"/></linearGradient>
<filter id="sh" x="-30%" y="-30%" width="160%" height="160%"><feDropShadow dx="0" dy="2" stdDeviation="2" flood-color="#3A2413" flood-opacity="0.22"/></filter>
</defs>
<rect width="96" height="96" fill="url(#bg)"/>
<g filter="url(#sh)">
  <circle cx="48" cy="48" r="34" fill="#E4D9C5" stroke="#C89A6B" stroke-width="1.5"/>
  <circle cx="48" cy="48" r="34" fill="url(#gl)"/>
  <circle cx="48" cy="48" r="25" fill="#B06B3A"/>
  <text x="48" y="52" font-family="Segoe UI,Arial" font-size="9.5" font-weight="800" fill="#FFFFFF" text-anchor="middle">ADESIVO</text>
</g>
</svg>`,
  "m4.svg": `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96" width="96" height="96" role="img" aria-label="Wind Banner 150x50 cm">
<defs>
<linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#F6ECDD"/><stop offset="1" stop-color="#EBD7BE"/></linearGradient>
<linearGradient id="gl" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FFFFFF" stop-opacity="0.7"/><stop offset="0.55" stop-color="#FFFFFF" stop-opacity="0.05"/><stop offset="1" stop-color="#FFFFFF" stop-opacity="0.35"/></linearGradient>
<filter id="sh" x="-30%" y="-30%" width="160%" height="160%"><feDropShadow dx="0" dy="2" stdDeviation="2" flood-color="#3A2413" flood-opacity="0.22"/></filter>
</defs>
<rect width="96" height="96" fill="url(#bg)"/>
<g filter="url(#sh)">
  <rect x="45" y="10" width="6" height="66" rx="3" fill="#6B3A1E"/>
  <path d="M51 12h27a4 4 0 0 1 4 4v40H51z" fill="#C89A6B" stroke="#B06B3A"/>
  <path d="M51 12h31v44H51z" fill="url(#gl)"/>
  <text x="67" y="34" font-family="Segoe UI,Arial" font-size="8" font-weight="800" fill="#FFFFFF" text-anchor="middle">150</text>
  <text x="67" y="45" font-family="Segoe UI,Arial" font-size="8" font-weight="800" fill="#FFFFFF" text-anchor="middle">×50</text>
  <rect x="33" y="72" width="30" height="12" rx="3" fill="#8A7A66"/>
  <rect x="33" y="72" width="30" height="5" rx="2.5" fill="#E4D9C5"/>
</g>
</svg>`,
  "m5.svg": `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96" width="96" height="96" role="img" aria-label="Wind Banner 200x70 cm">
<defs>
<linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#F6ECDD"/><stop offset="1" stop-color="#EBD7BE"/></linearGradient>
<linearGradient id="gl" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FFFFFF" stop-opacity="0.7"/><stop offset="0.55" stop-color="#FFFFFF" stop-opacity="0.05"/><stop offset="1" stop-color="#FFFFFF" stop-opacity="0.35"/></linearGradient>
<filter id="sh" x="-30%" y="-30%" width="160%" height="160%"><feDropShadow dx="0" dy="2" stdDeviation="2" flood-color="#3A2413" flood-opacity="0.22"/></filter>
</defs>
<rect width="96" height="96" fill="url(#bg)"/>
<g filter="url(#sh)">
  <rect x="45" y="9" width="6" height="67" rx="3" fill="#6B3A1E"/>
  <path d="M51 11h27a4 4 0 0 1 4 4v44H51z" fill="#BE7B45" stroke="#6B3A1E"/>
  <path d="M51 11h31v48H51z" fill="url(#gl)"/>
  <text x="67" y="34" font-family="Segoe UI,Arial" font-size="8" font-weight="800" fill="#FFFFFF" text-anchor="middle">200</text>
  <text x="67" y="45" font-family="Segoe UI,Arial" font-size="8" font-weight="800" fill="#FFFFFF" text-anchor="middle">×70</text>
  <rect x="32" y="72" width="32" height="12" rx="3" fill="#8A7A66"/>
  <rect x="32" y="72" width="32" height="5" rx="2.5" fill="#E4D9C5"/>
</g>
</svg>`,
  "m6.svg": `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96" width="96" height="96" role="img" aria-label="Wind Banner 250x75 cm">
<defs>
<linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#F6ECDD"/><stop offset="1" stop-color="#EBD7BE"/></linearGradient>
<linearGradient id="gl" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FFFFFF" stop-opacity="0.7"/><stop offset="0.55" stop-color="#FFFFFF" stop-opacity="0.05"/><stop offset="1" stop-color="#FFFFFF" stop-opacity="0.35"/></linearGradient>
<filter id="sh" x="-30%" y="-30%" width="160%" height="160%"><feDropShadow dx="0" dy="2" stdDeviation="2" flood-color="#3A2413" flood-opacity="0.22"/></filter>
</defs>
<rect width="96" height="96" fill="url(#bg)"/>
<g filter="url(#sh)">
  <rect x="44" y="8" width="6" height="68" rx="3" fill="#6B3A1E"/>
  <path d="M50 10h28a4 4 0 0 1 4 4v48H50z" fill="#B06B3A" stroke="#6B3A1E"/>
  <path d="M50 10h32v52H50z" fill="url(#gl)"/>
  <text x="66" y="34" font-family="Segoe UI,Arial" font-size="8" font-weight="800" fill="#FFFFFF" text-anchor="middle">250</text>
  <text x="66" y="45" font-family="Segoe UI,Arial" font-size="8" font-weight="800" fill="#FFFFFF" text-anchor="middle">×75</text>
  <rect x="31" y="72" width="34" height="12" rx="3" fill="#8A7A66"/>
  <rect x="31" y="72" width="34" height="5" rx="2.5" fill="#E4D9C5"/>
</g>
</svg>`,
  "camisa.svg": `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96" width="96" height="96" role="img" aria-label="Camisa personalizada">
<defs>
<linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#F3E9FC"/><stop offset="1" stop-color="#E7CFF9"/></linearGradient>
<linearGradient id="gl" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FFFFFF" stop-opacity="0.55"/><stop offset="0.55" stop-color="#FFFFFF" stop-opacity="0.05"/><stop offset="1" stop-color="#FFFFFF" stop-opacity="0.3"/></linearGradient>
<filter id="sh" x="-30%" y="-30%" width="160%" height="160%"><feDropShadow dx="0" dy="2" stdDeviation="2" flood-color="#2A0640" flood-opacity="0.28"/></filter>
</defs>
<rect width="96" height="96" fill="url(#bg)"/>
<g filter="url(#sh)">
  <path d="M36 14 L14 23 L6 44 L21 51 L28 41 L28 86 L68 86 L68 41 L75 51 L90 44 L82 23 L60 14 C58 25 54 29 48 29 C42 29 38 25 36 14 Z" fill="url(#gl)"/>
  <path d="M36 14 L14 23 L6 44 L21 51 L28 41 L28 86 L68 86 L68 41 L75 51 L90 44 L82 23 L60 14 C58 25 54 29 48 29 C42 29 38 25 36 14 Z" fill="#8820D8" opacity="0.92"/>
  <path d="M36 14 L14 23 L6 44 L21 51 L28 41 L28 86 L68 86 L68 41 L75 51 L90 44 L82 23 L60 14 C58 25 54 29 48 29 C42 29 38 25 36 14 Z" fill="url(#gl)"/>
  <path d="M36 14 C38 25 42 29 48 29 C54 29 58 25 60 14 L54 12 C53 19 51 22 48 22 C45 22 43 19 42 12 Z" fill="#500878"/>
  <rect x="38" y="46" width="20" height="24" rx="3" fill="#F3E9FC" opacity="0.92"/>
  <rect x="42" y="52" width="12" height="3" rx="1.5" fill="#8820D8"/>
  <rect x="42" y="59" width="12" height="3" rx="1.5" fill="#AB55F0"/>
</g>
</svg>`,
  "default.svg": `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96" width="96" height="96" role="img" aria-label="Material">
<defs>
<linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#F3E9FC"/><stop offset="1" stop-color="#E7CFF9"/></linearGradient>
<linearGradient id="gl" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FFFFFF" stop-opacity="0.7"/><stop offset="0.55" stop-color="#FFFFFF" stop-opacity="0.05"/><stop offset="1" stop-color="#FFFFFF" stop-opacity="0.35"/></linearGradient>
<filter id="sh" x="-30%" y="-30%" width="160%" height="160%"><feDropShadow dx="0" dy="2" stdDeviation="2" flood-color="#2A0640" flood-opacity="0.22"/></filter>
</defs>
<rect width="96" height="96" fill="url(#bg)"/>
<g opacity="0.95" filter="url(#sh)">
  <rect x="20" y="14" width="56" height="68" rx="3" fill="#FFFFFF" stroke="#AB55F0"/>
  <path d="M20 24h56" stroke="#E7CFF9" stroke-width="2"/>
  <rect x="28" y="34" width="40" height="3" rx="1.5" fill="#8820D8" opacity="0.55"/>
  <rect x="28" y="42" width="40" height="3" rx="1.5" fill="#8820D8" opacity="0.55"/>
  <rect x="28" y="50" width="30" height="3" rx="1.5" fill="#8820D8" opacity="0.55"/>
  <rect x="28" y="58" width="40" height="3" rx="1.5" fill="#8820D8" opacity="0.55"/>
  <rect x="28" y="66" width="24" height="3" rx="1.5" fill="#8820D8" opacity="0.55"/>
</g>
</svg>`
};