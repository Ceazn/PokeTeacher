import FontAwesome from '@expo/vector-icons/FontAwesome';
import { DarkTheme, ThemeProvider } from '@react-navigation/native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useRef, useState } from 'react';
import { View } from 'react-native';
import 'react-native-reanimated';

import { RegulationBanner } from '@/src/components/shared/RegulationBanner';
import { getDatabase } from '@/src/data/db';
import { useRegulations } from '@/src/data/queries/useRegulation';
import { useRegulationStore } from '@/src/store/regulationStore';
import '../global.css';

export { ErrorBoundary } from 'expo-router';

export const unstable_settings = {
  initialRouteName: '(tabs)',
};

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Retry once on failure; regulation data falls back to cache on error.
      retry: 1,
      // Don't refetch on window focus in mobile (no windows).
      refetchOnWindowFocus: false,
    },
  },
});

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    ...FontAwesome.font,
  });
  const [dbReady, setDbReady] = useState(false);

  // Initialise the DB on first render (copies snapshot on first launch,
  // runs pending migrations).
  useEffect(() => {
    getDatabase()
      .then(() => setDbReady(true))
      .catch((err) => {
        console.error('[DB] Init failed:', err);
        // Still mark ready so the app doesn't hang; tables will be recreated
        // by the migration runner on next launch.
        setDbReady(true);
      });
  }, []);

  useEffect(() => {
    if (fontError) throw fontError;
  }, [fontError]);

  useEffect(() => {
    if (fontsLoaded && dbReady) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, dbReady]);

  if (!fontsLoaded || !dbReady) return null;

  return (
    <QueryClientProvider client={queryClient}>
      <RootLayoutNav />
    </QueryClientProvider>
  );
}

function RootLayoutNav() {
  return (
    // Always dark — the app.json sets userInterfaceStyle to "dark".
    <ThemeProvider value={DarkTheme}>
      <View className="flex-1 bg-brand-dark">
        {/* Regulation fetch runs here so it's available across all screens. */}
        <RegulationSync />
        <RegulationBanner />
        <Stack>
          <Stack.Screen name="(tabs)"  options={{ headerShown: false }} />
          <Stack.Screen name="team"    options={{ headerShown: false }} />
        </Stack>
      </View>
    </ThemeProvider>
  );
}

/**
 * Invisible component that runs the regulation query and syncs the result
 * into the Zustand store. Separated from RootLayoutNav to keep the layout
 * component clean.
 */
function RegulationSync() {
  const { data: regulations } = useRegulations();
  const { setActiveRegulation, setPendingRegulationUpdate, activeRegulation } =
    useRegulationStore();
  const previousRegIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!regulations || regulations.length === 0) return;

    // Use the first regulation as the active one (query layer sets is_active).
    const active = regulations[0];

    // If the regulation ID changed since last check, surface the update banner.
    if (
      previousRegIdRef.current !== null &&
      previousRegIdRef.current !== active.id
    ) {
      setPendingRegulationUpdate(active);
      // TODO (Tier 1.3): validate saved teams against new reg and populate
      // staleTeamNotices via setStaleTeamNotices().
    }

    previousRegIdRef.current = active.id;
    setActiveRegulation(active);
  }, [regulations, setActiveRegulation, setPendingRegulationUpdate]);

  return null;
}
