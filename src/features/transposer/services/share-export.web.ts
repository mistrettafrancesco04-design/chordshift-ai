import type { SheetPage } from '../types';

/** Web: downloads each rendered page as PNG. */
export async function shareRenderedPages(pages: SheetPage[], title: string): Promise<void> {
  pages.forEach((page, index) => {
    const a = document.createElement('a');
    a.href = page.uri;
    a.download = `${title}${pages.length > 1 ? `-seite-${index + 1}` : ''}.png`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  });
}
