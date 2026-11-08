/** Web fallback – react-native-web's Alert is a no-op. */
export function notify(title: string, message?: string) {
  window.alert(message ? `${title}\n\n${message}` : title);
}

export async function confirm(options: { title: string; message?: string; confirmLabel: string }): Promise<boolean> {
  return window.confirm(options.message ? `${options.title}\n\n${options.message}` : options.title);
}
