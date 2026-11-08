import { Alert } from 'react-native';

/** Simple message dialog (native Alert; window.alert on web). */
export function notify(title: string, message?: string) {
  Alert.alert(title, message);
}

/** Yes/no confirmation that resolves to the user's choice. */
export function confirm(options: {
  title: string;
  message?: string;
  confirmLabel: string;
  destructive?: boolean;
}): Promise<boolean> {
  return new Promise((resolve) => {
    Alert.alert(
      options.title,
      options.message,
      [
        { text: 'Abbrechen', style: 'cancel', onPress: () => resolve(false) },
        {
          text: options.confirmLabel,
          style: options.destructive ? 'destructive' : 'default',
          onPress: () => resolve(true),
        },
      ],
      { cancelable: true, onDismiss: () => resolve(false) },
    );
  });
}
