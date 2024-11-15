import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { ModalProvider, createModalStack } from 'react-native-modalfy';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useFonts } from 'expo-font';
import { Slot } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import 'react-native-url-polyfill/auto';
import 'react-native-reanimated';

import { useColorScheme } from 'react-native';

import { SessionProvider } from '@/contexts/auth';
import { AccountProvider } from '@/contexts/account';

import ConfirmModal from '@/components/modals/ConfirmModal'; 
import OptionModal from '@/components/modals/OptionModal';

const modalStack = createModalStack({ ConfirmModal, OptionModal }, { backdropOpacity: 0.6 });

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  console.log(`Color scheme: ${colorScheme}`);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme }>
        <SessionProvider>
          <AccountProvider>
            <ModalProvider stack={modalStack}>
              <Slot />
            </ModalProvider>
          </AccountProvider>
        </SessionProvider>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
