/** Web: engine output stays in memory as a blob URL. */
export async function writeImage(base64: string): Promise<string> {
  const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
  return URL.createObjectURL(new Blob([bytes], { type: 'image/png' }));
}
