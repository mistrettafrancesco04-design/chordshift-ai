import { type ComponentType, type Ref, useMemo, useRef } from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';
import { WebView } from 'react-native-webview';

import { engine } from './engine-client';
import { buildEngineHtml } from './engine-runtime';

interface WebViewHandle {
  postMessage: (message: string) => void;
  reload: () => void;
}

/**
 * react-native-webview's published props type collapses to `never` with the React 19.3
 * typings, so the subset used here is declared explicitly.
 */
const EngineWebView = WebView as unknown as ComponentType<{
  ref?: Ref<WebViewHandle>;
  source: { html: string; baseUrl: string };
  originWhitelist: string[];
  javaScriptEnabled: boolean;
  onLoadStart: () => void;
  onLoadEnd: () => void;
  onMessage: (event: { nativeEvent: { data: string } }) => void;
  onContentProcessDidTerminate: () => void;
  onRenderProcessGone: () => void;
  style: ViewStyle;
}>;

/**
 * Invisible WebView that runs the image-processing engine (pdf.js, canvas, Tesseract).
 * Mounted once at the root. A fixed https baseUrl gives the page a real origin so
 * Blob-URL workers are allowed on iOS and Android.
 */
export function EngineHost() {
  const ref = useRef<WebViewHandle>(null);
  const html = useMemo(() => buildEngineHtml(), []);

  return (
    <View pointerEvents="none" style={styles.host}>
      <EngineWebView
        ref={ref}
        source={{ html, baseUrl: 'https://engine.chordshift.app/' }}
        originWhitelist={['*']}
        javaScriptEnabled
        onLoadStart={() => engine.disconnect('Bildverarbeitung wird neu gestartet')}
        onLoadEnd={() => engine.connect((message) => ref.current?.postMessage(message))}
        onMessage={(event) => engine.receive(event.nativeEvent.data)}
        onContentProcessDidTerminate={() => ref.current?.reload()}
        onRenderProcessGone={() => ref.current?.reload()}
        style={styles.webview}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  host: {
    position: 'absolute',
    width: 1,
    height: 1,
    opacity: 0,
    overflow: 'hidden',
  },
  webview: {
    width: 1,
    height: 1,
    backgroundColor: 'transparent',
  },
});
