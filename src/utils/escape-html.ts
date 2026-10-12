// Échappe une valeur avant interpolation dans du HTML (innerHTML, attributs).
// Les champs ville / adresse / enseigne proviennent du flux public roulez-eco,
// renseignés par les exploitants de stations : ils sont considérés non fiables.
export function escapeHtml(value: unknown): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
