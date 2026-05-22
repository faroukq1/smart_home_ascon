import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useTranslation } from "../../hooks/useTranslation";
import { COLORS, SPACING, BORDER_RADIUS, FONTS } from "../../constants/design";
import { MaterialIcons } from "@expo/vector-icons";
import { controlAPI } from "../../api/client";

export default function ControlScreen() {
  const { t } = useTranslation();
  const [ledState, setLedState] = useState(false);
  const [buzzerState, setBuzzerState] = useState(false);
  const [systemState, setSystemState] = useState(false);
  const [loadingLed, setLoadingLed] = useState(false);
  const [loadingBuzzer, setLoadingBuzzer] = useState(false);
  const [loadingSystem, setLoadingSystem] = useState(false);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    const loadInitialState = async () => {
      try {
        const [ledRes, buzzerRes, systemRes] = await Promise.all([
          controlAPI.getLedStatus(),
          controlAPI.getBuzzerStatus(),
          controlAPI.getSystemStatus(),
        ]);
        setLedState(!!ledRes.data);
        setBuzzerState(!!buzzerRes.data);
        setSystemState(!!systemRes.data);
      } catch (error: any) {
        if (error?.response?.status !== 401) {
          console.warn("Could not load device state:", error?.message);
        }
      } finally {
        setInitializing(false);
      }
    };
    loadInitialState();
  }, []);

  const handleToggleLED = async () => {
    setLoadingLed(true);
    try {
      const newState = !ledState;
      await controlAPI.toggleLED(newState);
      setLedState(newState);
    } catch (error: any) {
      if (!error?.response) {
        Alert.alert(t("error"), t("network_error"));
      } else {
        Alert.alert(t("error"), error?.response?.data?.error || t("led_toggle_failed"));
      }
    } finally {
      setLoadingLed(false);
    }
  };

  const handleToggleBuzzer = async () => {
    setLoadingBuzzer(true);
    try {
      const newState = !buzzerState;
      await controlAPI.toggleBuzzer(newState);
      setBuzzerState(newState);
    } catch (error: any) {
      if (!error?.response) {
        Alert.alert(t("error"), t("network_error"));
      } else {
        Alert.alert(t("error"), error?.response?.data?.error || t("buzzer_toggle_failed"));
      }
    } finally {
      setLoadingBuzzer(false);
    }
  };

  const handleToggleSystem = async () => {
    setLoadingSystem(true);
    try {
      const newState = !systemState;
      await controlAPI.toggleSystem(newState);
      setSystemState(newState);
    } catch (error: any) {
      if (!error?.response) {
        Alert.alert(t("error"), t("network_error"));
      } else {
        Alert.alert(t("error"), error?.response?.data?.error || t("system_toggle_failed"));
      }
    } finally {
      setLoadingSystem(false);
    }
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t("control")}</Text>
        <Text style={styles.headerSubtitle}>{t("sec_platform")}</Text>
      </View>

      <View style={styles.content}>
        {initializing ? (
          <View style={styles.centerLoader}>
            <ActivityIndicator size="large" color={COLORS.primary} />
          </View>
        ) : (
          <>
            {/* System On/Off */}
            <SystemSwitch
              state={systemState}
              loading={loadingSystem}
              onToggle={handleToggleSystem}
              label={t("system_power")}
            />

            <View style={styles.spacer} />

            {/* LED Control */}
            <ControlSwitch
              icon="flashlight-on"
              label={t("flash_light")}
              state={ledState}
              loading={loadingLed}
              onToggle={handleToggleLED}
            />

            <View style={styles.spacer} />

            {/* Buzzer Control */}
            <ControlSwitch
              icon="volume-up"
              label={t("buzzer_alarm")}
              state={buzzerState}
              loading={loadingBuzzer}
              onToggle={handleToggleBuzzer}
            />
          </>
        )}

        <View style={styles.spacer} />
      </View>
    </ScrollView>
  );
}

const SystemSwitch = ({ state, loading, onToggle, label }: any) => (
  <TouchableOpacity
    style={[styles.systemItem, state ? styles.systemItemOn : styles.systemItemOff]}
    onPress={onToggle}
    disabled={loading}
  >
    <View style={styles.controlLeft}>
      <MaterialIcons
        name="power-settings-new"
        size={28}
        color={state ? "#fff" : COLORS.textSecondary}
      />
      <View style={{ marginLeft: SPACING.md }}>
        <Text style={[styles.systemLabel, state && styles.systemLabelOn]}>{label}</Text>
        <Text style={[styles.systemStatus, state && styles.systemStatusOn]}>
          {state ? "ON" : "OFF"}
        </Text>
      </View>
    </View>

    <View style={styles.toggleContainer}>
      {loading ? (
        <ActivityIndicator size="small" color={state ? "#fff" : COLORS.primary} />
      ) : (
        <View style={[styles.toggleBg, state && styles.toggleBgActive]}>
          <View style={[styles.toggleDot, state && styles.toggleDotActive]} />
        </View>
      )}
    </View>
  </TouchableOpacity>
);

const ControlSwitch = ({ icon, label, state, loading, onToggle }: any) => (
  <TouchableOpacity
    style={[styles.controlItem, state && styles.controlItemActive]}
    onPress={onToggle}
    disabled={loading}
  >
    <View style={styles.controlLeft}>
      <MaterialIcons
        name={icon as any}
        size={24}
        color={state ? COLORS.primary : COLORS.textSecondary}
      />
      <Text style={[styles.controlLabel, state && styles.controlLabelActive]}>
        {label}
      </Text>
    </View>

    <View style={styles.toggleContainer}>
      {loading ? (
        <ActivityIndicator size="small" color={COLORS.primary} />
      ) : (
        <View style={[styles.toggleBg, state && styles.toggleBgActive]}>
          <View style={[styles.toggleDot, state && styles.toggleDotActive]} />
        </View>
      )}
    </View>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.xl,
    paddingBottom: SPACING.lg,
  },
  headerTitle: {
    fontSize: FONTS.sizes["2xl"],
    fontWeight: FONTS.weights.bold,
    color: COLORS.text,
  },
  headerSubtitle: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },
  content: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.xl,
  },
  spacer: {
    height: SPACING.md,
  },
  centerLoader: {
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: SPACING.xl,
  },
  controlItem: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    borderColor: `${COLORS.text}1A`,
    padding: SPACING.lg,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  controlItemActive: {
    borderColor: COLORS.primary + "33",
  },
  controlLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  controlLabel: {
    fontSize: FONTS.sizes.base,
    fontWeight: FONTS.weights.medium,
    color: COLORS.text,
    marginLeft: SPACING.md,
  },
  controlLabelActive: {
    color: COLORS.primary,
  },
  toggleContainer: {
    justifyContent: "center",
    alignItems: "center",
  },
  toggleBg: {
    width: 50,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.textTertiary,
    justifyContent: "center",
    paddingHorizontal: 2,
  },
  toggleBgActive: {
    backgroundColor: COLORS.primary,
  },
  toggleDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.surface,
    alignSelf: "flex-start",
  },
  toggleDotActive: {
    alignSelf: "flex-end",
  },
  systemItem: {
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    padding: SPACING.lg,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  systemItemOn: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  systemItemOff: {
    backgroundColor: COLORS.surface,
    borderColor: `${COLORS.text}1A`,
  },
  systemLabel: {
    fontSize: FONTS.sizes.base,
    fontWeight: FONTS.weights.bold,
    color: COLORS.text,
  },
  systemLabelOn: {
    color: "#fff",
  },
  systemStatus: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  systemStatusOn: {
    color: "rgba(255,255,255,0.8)",
  },
});
