export type BackNavigation = {
  canGoBack: () => boolean;
  goBack: () => void;
};

export function safeGoBack(navigation: BackNavigation, fallback: () => void) {
  if (navigation.canGoBack()) {
    navigation.goBack();
    return;
  }

  fallback();
}
