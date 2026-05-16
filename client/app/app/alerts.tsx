import React, { useState, useEffect, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
  FlatList,
  Alert,
  Image,
} from "react-native";
import { useTranslation } from "../../hooks/useTranslation";
import { COLORS, SPACING, BORDER_RADIUS, FONTS } from "../../constants/design";
import { MaterialIcons } from "@expo/vector-icons";
import { notificationAPI, controlAPI } from "../../api/client";

export default function AlertsScreen() {
  const { t } = useTranslation();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [controls, setControls] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadFeed = async (silent: boolean = false) => {
    try {
      const [notificationsRes, controlsRes] = await Promise.all([
        notificationAPI.getAll(100),
        controlAPI.getHistory(100),
      ]);

      setNotifications(notificationsRes.data);
      setControls(controlsRes.data);
    } catch (error: any) {
      // Only log non-401 errors
      if (error?.response?.status !== 401) {
        console.error("Failed to load feed:", error?.message);
      }
      setNotifications([]);
      setControls([]);
    } finally {
      if (!silent) {
        setLoading(false);
      }
      setRefreshing(false);
    }
  };

  useEffect(() => {
    let isMounted = true;
    loadFeed();
    const interval = setInterval(() => {
      if (isMounted) {
        loadFeed(true);
      }
    }, 5000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadFeed(true);
  };

  const handleDeleteNotification = (id: number) => {
    Alert.alert(t("delete_confirm"), "", [
      { text: t("cancel"), style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await notificationAPI.delete(id);
            setNotifications(notifications.filter((n) => n.id !== id));
          } catch (error) {
            Alert.alert("Error", "Failed to delete notification");
          }
        },
      },
    ]);
  };

  const handleClearAll = () => {
    Alert.alert(t("clear_all"), t("confirm_delete_all"), [
      { text: t("cancel"), style: "cancel" },
      {
        text: t("delete_all_btn"),
        style: "destructive",
        onPress: async () => {
          try {
            await Promise.all([
              notificationAPI.clearAll(),
              controlAPI.clearAll(),
            ]);
            setNotifications([]);
            setControls([]);
          } catch (error) {
            Alert.alert("Error", "Failed to clear history");
          }
        },
      },
    ]);
  };

  const feedItems = useMemo(() => {
    const notificationItems = notifications.map((notification) => ({
      ...notification,
      key: `notification-${notification.id}`,
      kind: "notification",
    }));

    const controlItems = controls
      .filter((control) => control.type === "led" || control.type === "buzzer")
      .map((control) => ({
        ...control,
        key: `control-${control.id}`,
        kind: "control",
      }));

    const getTimestamp = (item: any) =>
      item.createdAt ? new Date(item.createdAt).getTime() : 0;

    return [...notificationItems, ...controlItems].sort(
      (a, b) => getTimestamp(b) - getTimestamp(a),
    );
  }, [notifications, controls]);

  const totalItems = feedItems.length;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>{t("alerts")}</Text>
          <Text style={styles.headerSubtitle}>{totalItems} notifications</Text>
        </View>
        {totalItems > 0 && (
          <TouchableOpacity onPress={handleClearAll}>
            <MaterialIcons
              name="delete-sweep"
              size={24}
              color={COLORS.danger}
            />
          </TouchableOpacity>
        )}
      </View>

      {loading ? (
        <View style={styles.centerLoader}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : totalItems === 0 ? (
        <View style={styles.emptyContainer}>
          <MaterialIcons
            name="notifications-off"
            size={60}
            color={COLORS.textTertiary}
          />
          <Text style={styles.emptyText}>{t("no_alerts")}</Text>
        </View>
      ) : (
        <FlatList
          data={feedItems}
          keyExtractor={(item) => item.key}
          renderItem={({ item }) => (
            <NotificationItem
              item={item}
              onDelete={
                item.kind === "notification"
                  ? () => handleDeleteNotification(item.id)
                  : undefined
              }
              t={t}
            />
          )}
          scrollEnabled
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        />
      )}
    </View>
  );
}

const NotificationItem = ({ item, onDelete, t }: any) => {
  const isAlarm = item.kind === "notification" && item.type === "alarm";
  const isControl = item.kind === "control";

  const getControlTitle = () => {
    if (item.type === "led") {
      return item.action === "on" ? t("led_on") : t("led_off");
    }
    if (item.type === "buzzer") {
      return item.action === "on" ? t("buzzer_on") : t("buzzer_off");
    }
    return `${item.type} ${item.action}`;
  };

  const title = isAlarm
    ? t("detect_movement")
    : isControl
      ? getControlTitle()
      : item.status;

  const iconName = isAlarm
    ? "warning"
    : isControl
      ? item.type === "led"
        ? "highlight"
        : "volume-up"
      : "settings-remote";

  return (
    <View
      style={[
        styles.notificationItem,
        {
          borderColor: isAlarm ? COLORS.danger : COLORS.text + "1A",
          borderLeftColor: isAlarm ? COLORS.danger : COLORS.info,
        },
      ]}
    >
      {isAlarm && item.imageUrl ? (
        <Image
          source={{ uri: item.imageUrl }}
          style={styles.alertImage}
          resizeMode="cover"
        />
      ) : isAlarm ? (
        <View style={styles.alertImagePlaceholder}>
          <MaterialIcons name="image" size={36} color={COLORS.textTertiary} />
          <Text style={styles.alertImagePlaceholderText}>{t("no_img")}</Text>
        </View>
      ) : null}
      <View style={styles.notificationContent}>
        <View
          style={[
            styles.notificationIcon,
            {
              backgroundColor: isAlarm
                ? COLORS.danger + "20"
                : COLORS.info + "20",
            },
          ]}
        >
          <MaterialIcons
            name={iconName as any}
            size={20}
            color={isAlarm ? COLORS.danger : COLORS.info}
          />
        </View>

        <View style={styles.notificationText}>
          <Text
            style={[
              styles.notificationTitle,
              { color: isAlarm ? COLORS.danger : COLORS.text },
            ]}
          >
            {title}
          </Text>
          <Text style={styles.notificationTime}>
            {item.date} | {item.time}
          </Text>
        </View>

        {onDelete && (
          <TouchableOpacity onPress={onDelete} style={styles.deleteButton}>
            <MaterialIcons
              name="delete-outline"
              size={18}
              color={COLORS.textSecondary}
            />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
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
  centerLoader: {
    justifyContent: "center",
    alignItems: "center",
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyText: {
    fontSize: FONTS.sizes.base,
    color: COLORS.textSecondary,
    marginTop: SPACING.md,
  },
  list: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
  },
  notificationItem: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    borderLeftWidth: 4,
    marginBottom: SPACING.md,
    padding: SPACING.md,
    overflow: "hidden",
  },
  alertImage: {
    width: "100%",
    height: 180,
    borderRadius: BORDER_RADIUS.md,
    marginBottom: SPACING.md,
  },
  alertImagePlaceholder: {
    width: "100%",
    height: 180,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: `${COLORS.text}1A`,
    marginBottom: SPACING.md,
    justifyContent: "center",
    alignItems: "center",
  },
  alertImagePlaceholderText: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.textTertiary,
    marginTop: SPACING.sm,
  },
  notificationContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  notificationIcon: {
    width: 40,
    height: 40,
    borderRadius: BORDER_RADIUS.sm,
    justifyContent: "center",
    alignItems: "center",
    marginRight: SPACING.md,
  },
  notificationText: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: FONTS.sizes.sm,
    fontWeight: FONTS.weights.bold,
    marginBottom: SPACING.xs,
  },
  notificationTime: {
    fontSize: FONTS.sizes.xs,
    color: COLORS.textSecondary,
  },
  deleteButton: {
    padding: SPACING.sm,
  },
});
