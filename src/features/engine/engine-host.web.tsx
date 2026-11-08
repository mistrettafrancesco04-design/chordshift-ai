import { useEffect, useMemo, useRef } from 'react';

import { engine } from './engine-client';
import { buildEngineHtml } from './engine-runtime';

/** Web: same engine page in a hidden same-origin iframe. */
export function EngineHost() {
  const ref = useRef<HTMLIFrameElement>(null);
  const html = useMemo(() => buildEngineHtml(), []);

  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      if (event.source !== ref.current?.contentWindow || typeof event.data !== 'string') return;
      engine.connect((message) => ref.current?.contentWindow?.postMessage(message, '*'));
      engine.receive(event.data);
    };
    window.addEventListener('message', onMessage);
    return () => {
      window.removeEventListener('message', onMessage);
      engine.disconnect();
    };
  }, []);

  return (
    <iframe
      ref={ref}
      title="chordshift-engine"
      srcDoc={html}
      aria-hidden
      style={{ position: 'absolute', width: 1, height: 1, opacity: 0, border: 0, pointerEvents: 'none' }}
    />
  );
}
