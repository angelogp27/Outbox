// Evita mandarle a un usuario real una URL que solo tiene sentido dentro de
// la red local de quien está corriendo el server (IP privada o localhost) —
// no es alcanzable para nadie más y expone infraestructura interna sin
// necesidad. Usar antes de incluir APP_URL en cualquier mensaje saliente.
export function esUrlPublica(url: string): boolean {
  try {
    const { hostname } = new URL(url);
    if (hostname === "localhost") return false;
    if (/^127\./.test(hostname)) return false;
    if (/^10\./.test(hostname)) return false;
    if (/^192\.168\./.test(hostname)) return false;
    if (/^172\.(1[6-9]|2\d|3[01])\./.test(hostname)) return false;
    return true;
  } catch {
    return false;
  }
}
