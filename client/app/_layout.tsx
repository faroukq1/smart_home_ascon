import "react-native-get-random-values";
import React from "react";
import { View } from "react-native";
import { Stack, useRouter } from "expo-router";
import {
  SafeAreaProvider,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { AuthProvider, useAuth } from "../context/AuthContext";
import { COLORS } from "../constants/design";
import * as SplashScreen from "expo-splash-screen";
import * as Notifications from "expo-notifications";
import { configureNotificationHandler } from "../utils/notifications";

configureNotificationHandler();

SplashScreen.preventAutoHideAsync();

function RootLayout() {
  const { isLoading } = useAuth();
  const router = useRouter();

  React.useEffect(() => {
    if (!isLoading) {
      SplashScreen.hideAsync();
    }
  }, [isLoading]);

  React.useEffect(() => {
    const sub = Notifications.addNotificationResponseReceivedListener(() => {
      router.push("/app/alerts");
    });
    return () => sub.remove();
  }, [router]);

  if (isLoading) {
    return null;
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: "default",
      }}
    />
  );
}

function AppShell({ children }: { children: React.ReactNode }) {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: COLORS.background,
        paddingTop: insets.top + 16,
        paddingBottom: insets.bottom + 16,
      }}
    >
      {children}
    </View>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <AppShell>
          <RootLayout />
        </AppShell>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
