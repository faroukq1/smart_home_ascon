import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  Image,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useTranslation } from "../../hooks/useTranslation";
import { notificationAPI } from "../../api/client";
import { COLORS, SPACING, BORDER_RADIUS, FONTS } from "../../constants/design";

export default function GalleryScreen() {
  const { t } = useTranslation();
  const [images, setImages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadImages = async (silent: boolean = false) => {
    try {
      const response = await notificationAPI.getAll(200);
      const withImages = (response.data || []).filter(
        (item: any) => item.imageUrl,
      );
      setImages(withImages);
    } catch (error: any) {
      if (error?.response?.status !== 401) {
        console.error("Failed to load gallery:", error?.message);
      }
      setImages([]);
    } finally {
      if (!silent) {
        setLoading(false);
      }
      setRefreshing(false);
    }
  };

  useEffect(() => {
    let isMounted = true;
    loadImages();
    const interval = setInterval(() => {
      if (isMounted) {
        loadImages(true);
      }
    }, 5000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadImages(true);
  };

  const sections = useMemo(() => {
    const map = new Map<string, any[]>();
    const order: string[] = [];

    images.forEach((item) => {
      const date = item.date || t("unknown_date");
      if (!map.has(date)) {
        map.set(date, []);
        order.push(date);
      }
      map.get(date)?.push(item);
    });

    return order.map((date) => ({ date, items: map.get(date) || [] }));
  }, [images, t]);

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t("gallery")}</Text>
        <Text style={styles.headerSubtitle}>
          {images.length} {t("images")}
        </Text>
      </View>

      {loading ? (
        <View style={styles.centerLoader}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : images.length === 0 ? (
        <View style={styles.emptyContainer}>
          <MaterialIcons
            name="photo-library"
            size={60}
            color={COLORS.textTertiary}
          />
          <Text style={styles.emptyText}>{t("no_gallery")}</Text>
        </View>
      ) : (
        <View style={styles.content}>
          {sections.map((section) => (
            <View key={section.date} style={styles.section}>
              <Text style={styles.sectionTitle}>{section.date}</Text>
              <View style={styles.grid}>
                {section.items.map((item: any) => (
                  <Image
                    key={item.id}
                    source={{ uri: item.imageUrl }}
                    style={styles.image}
                  />
                ))}
              </View>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

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
  centerLoader: {
    justifyContent: "center",
    alignItems: "center",
    height: 200,
  },
  emptyContainer: {
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: SPACING.xl,
  },
  emptyText: {
    fontSize: FONTS.sizes.base,
    color: COLORS.textSecondary,
    marginTop: SPACING.md,
  },
  content: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.xl,
  },
  section: {
    marginBottom: SPACING.xl,
  },
  sectionTitle: {
    fontSize: FONTS.sizes.base,
    fontWeight: FONTS.weights.bold,
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  image: {
    width: "48%",
    height: 140,
    borderRadius: BORDER_RADIUS.md,
    marginBottom: SPACING.md,
  },
});
