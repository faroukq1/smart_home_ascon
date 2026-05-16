import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  Image,
  TouchableOpacity,
} from "react-native";
import { useTranslation } from "../../hooks/useTranslation";
import { useAuth } from "../../context/AuthContext";
import { COLORS, SPACING, BORDER_RADIUS, FONTS } from "../../constants/design";
import { MaterialIcons } from "@expo/vector-icons";
import { sensorAPI, notificationAPI } from "../../api/client";

export default function DashboardScreen() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [sensorStatus, setSensorStatus] = useState("connected");
  const [rawStatus, setRawStatus] = useState("0");
  const [lastImageUrl, setLastImageUrl] = useState<string | null>(null);
  const [totalAlerts, setTotalAlerts] = useState(0);
  const [lastAlertTime, setLastAlertTime] = useState("--:--");
  const [markingSeen, setMarkingSeen] = useState(false);

  const loadData = async (silent: boolean = false) => {
    try {
      const [statusRes, statsRes] = await Promise.all([
        sensorAPI.getStatus(),
        notificationAPI.getStats(),
      ]);

      setSensorStatus(statusRes.data.status);
      setRawStatus(statusRes.data.rawStatus);
      setLastImageUrl(statusRes.data.lastImageUrl);
      setTotalAlerts(statsRes.data.totalAlerts);

      if (statsRes.data.lastAlert) {
        setLastAlertTime(`${statsRes.data.lastAlert.time}`);
      }
    } catch (error: any) {
      // Only log non-401 errors
      if (error?.response?.status !== 401) {
        console.error("Failed to load data:", error?.message);
      }
      // Set default values for error state
      setSensorStatus("offline");
      setTotalAlerts(0);
    } finally {
      if (!silent) {
        setLoading(false);
      }
      setRefreshing(false);
    }
  };

  useEffect(() => {
    let isMounted = true;
    loadData();
    const interval = setInterval(() => {
      if (isMounted) {
        loadData(true);
      }
    }, 5000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData(true);
  };

  const isMotion = sensorStatus === "motion";

  const handleMarkSeen = async () => {
    if (markingSeen) return;
    setMarkingSeen(true);
    try {
      await sensorAPI.updateStatus("0");
      setSensorStatus("connected");
      setRawStatus("0");
    } catch (error: any) {
      if (error?.response?.status !== 401) {
        console.error("Failed to mark seen:", error?.message);
      }
    } finally {
      setMarkingSeen(false);
    }
  };

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t("dash")}</Text>
        <Text style={styles.headerSubtitle}>{t("sec_platform")}</Text>
      </View>

      {loading ? (
        <View style={styles.centerLoader}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        <View style={styles.content}>
          {/* Device Status Card */}
          <View
            style={[
              styles.statusCard,
              {
                borderColor: isMotion ? COLORS.danger : COLORS.text + "1A",
                backgroundColor: isMotion
                  ? COLORS.danger + "15"
                  : COLORS.surface,
              },
            ]}
          >
            <View style={styles.statusContent}>
              <View>
                <Text style={styles.statusDeviceTitle}>ESP32-CAM GATEWAY</Text>
                <View style={styles.statusBadge}>
                  <View
                    style={[
                      styles.statusIndicator,
                      {
                        backgroundColor: isMotion
                          ? COLORS.danger
                          : COLORS.success,
                      },
                    ]}
                  />
                  <Text
                    style={[
                      styles.statusText,
                      { color: isMotion ? COLORS.danger : COLORS.success },
                    ]}
                  >
                    {isMotion ? t("motion") : t("connected")}
                  </Text>
                </View>
              </View>
              <MaterialIcons
                name={isMotion ? "warning" : "wifi-tethering"}
                size={40}
                color={isMotion ? COLORS.danger : COLORS.primary}
              />
            </View>
            {isMotion && (
              <TouchableOpacity
                style={styles.markSeenButton}
                onPress={handleMarkSeen}
                disabled={markingSeen}
              >
                <Text style={styles.markSeenButtonText}>
                  {markingSeen ? "..." : t("mark_seen")}
                </Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.spacer} />

          {/* Stats Row */}
          <View style={styles.statsRow}>
            <StatBox
              icon="history"
              label={t("total_alerts")}
              value={totalAlerts.toString()}
              color={COLORS.warning}
            />
            <View style={styles.spacerHorizontal} />
            <StatBox
              icon="schedule"
              label={t("last_alert")}
              value={lastAlertTime}
              color={COLORS.info}
            />
          </View>

          <View style={styles.spacer} />

          {/* Last Image Section */}
          <Text style={styles.sectionTitle}>{t("last_img")}</Text>
          <View style={styles.imageContainer}>
            {lastImageUrl ? (
              <Image source={{ uri: lastImageUrl }} style={styles.image} />
            ) : (
              <View style={styles.noImagePlaceholder}>
                <MaterialIcons
                  name="image-search"
                  size={50}
                  color={COLORS.textTertiary}
                />
                <Text style={styles.noImageText}>{t("no_img")}</Text>
              </View>
            )}
          </View>

          <View style={styles.spacer} />
        </View>
      )}
    </ScrollView>
  );
}

const StatBox = ({ icon, label, value, color }: any) => (
  <View style={styles.statBox}>
    <MaterialIcons name={icon as any} size={20} color={color} />
    <Text style={styles.statLabel}>{label}</Text>
    <Text style={styles.statValue}>{value}</Text>
  </View>
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
    height: SPACING.lg,
  },
  spacerHorizontal: {
    width: SPACING.md,
  },
  centerLoader: {
    justifyContent: "center",
    alignItems: "center",
    height: 200,
  },
  statusCard: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    padding: SPACING.lg,
  },
  statusContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  markSeenButton: {
    marginTop: SPACING.md,
    alignSelf: "flex-start",
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
  },
  markSeenButtonText: {
    color: COLORS.surface,
    fontSize: FONTS.sizes.sm,
    fontWeight: FONTS.weights.bold,
  },
  statusDeviceTitle: {
    fontSize: FONTS.sizes.base,
    fontWeight: FONTS.weights.bold,
    color: COLORS.text,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: SPACING.sm,
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: SPACING.sm,
  },
  statusText: {
    fontSize: FONTS.sizes.sm,
    fontWeight: FONTS.weights.medium,
  },
  statsRow: {
    flexDirection: "row",
  },
  statBox: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
  },
  statLabel: {
    fontSize: FONTS.sizes.xs,
    color: COLORS.textSecondary,
    marginTop: SPACING.md,
  },
  statValue: {
    fontSize: FONTS.sizes.xl,
    fontWeight: FONTS.weights.bold,
    color: COLORS.text,
    marginTop: SPACING.sm,
  },
  sectionTitle: {
    fontSize: FONTS.sizes.base,
    fontWeight: FONTS.weights.bold,
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  imageContainer: {
    height: 220,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    borderColor: `${COLORS.text}1A`,
    overflow: "hidden",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  noImagePlaceholder: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  noImageText: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.textTertiary,
    marginTop: SPACING.md,
  },
});
