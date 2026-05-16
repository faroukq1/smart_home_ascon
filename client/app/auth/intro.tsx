import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "../../context/AuthContext";
import { useTranslation } from "../../hooks/useTranslation";
import { COLORS, SPACING, BORDER_RADIUS, FONTS } from "../../constants/design";
import { MaterialIcons } from "@expo/vector-icons";

export default function IntroScreen() {
  const router = useRouter();
  const { token } = useAuth();
  const { t } = useTranslation();

  useEffect(() => {
    if (token) {
      router.replace("/app/dashboard");
    }
  }, [token]);

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Background shape */}
      <View style={styles.bgShape} />

      {/* Content */}
      <View style={styles.content}>
        <View style={styles.spacing} />

        {/* Logo/Icon */}
        <View style={styles.logoContainer}>
          <MaterialIcons name="security" size={100} color={COLORS.primary} />
        </View>

        <Text style={styles.title}>SECURE CAM</Text>

        {/* Intro Text */}
        <Text style={styles.welcomeText}>{t("welcome")}</Text>
        <Text style={styles.subTitle}>{t("sub_welcome")}</Text>

        <View style={styles.spacer} />

        <Text style={styles.description}>{t("intro_desc")}</Text>

        <View style={styles.spacer} />

        {/* ASCON Banner */}
        <View style={styles.asconBanner}>
          <View style={styles.asconContent}>
            <MaterialIcons
              name="shield"
              size={24}
              color={COLORS.primary}
              style={styles.asconIcon}
            />
            <View style={styles.asconText}>
              <Text style={styles.asconLabel}>ASCON ENCRYPTION ACTIVE</Text>
              <Text style={styles.asconHash}>
                A3 F8 2D 91 7C 4A B5 6E 3F 20 8D 7A
              </Text>
            </View>
            <View style={styles.asconIndicator} />
          </View>
        </View>

        <View style={styles.spacer} />

        {/* Features */}
        <View style={styles.featuresRow}>
          <FeatureIcon icon="verified-user" label={t("device_status")} />
          <FeatureIcon icon="lock" label={t("encryption")} />
          <FeatureIcon icon="notifications" label={t("alerts")} />
          <FeatureIcon icon="videocam" label={t("control")} />
        </View>

        <View style={styles.spacer} />
        <View style={styles.spacer} />

        {/* Main Button */}
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => router.push("/auth/login")}
        >
          <Text style={styles.primaryButtonText}>{t("start")}</Text>
          <MaterialIcons
            name="arrow-forward"
            size={20}
            color={COLORS.text}
            style={styles.buttonIcon}
          />
        </TouchableOpacity>

        <View style={styles.spacer} />

        {/* Footer Text */}
        <Text style={styles.footerText}>{t("footer_text")}</Text>

        <View style={styles.spacing} />
      </View>
    </ScrollView>
  );
}

const FeatureIcon = ({ icon, label }: { icon: string; label: string }) => (
  <View style={styles.featureItem}>
    <MaterialIcons name={icon as any} size={22} color={COLORS.textTertiary} />
    <Text style={styles.featureLabel}>{label}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  bgShape: {
    position: "absolute",
    top: -150,
    left: 0,
    right: 0,
    height: 500,
    borderRadius: 500,
    backgroundColor: `${COLORS.primary}10`,
  },
  content: {
    flex: 1,
    paddingHorizontal: SPACING.lg,
  },
  spacing: {
    height: 30,
  },
  spacer: {
    height: SPACING.lg,
  },
  logoContainer: {
    alignItems: "center",
    marginVertical: SPACING.lg,
  },
  title: {
    fontSize: FONTS.sizes["2xl"],
    fontWeight: FONTS.weights.bold,
    color: COLORS.text,
    letterSpacing: 4,
    textAlign: "center",
    marginVertical: SPACING.sm,
  },
  welcomeText: {
    fontSize: FONTS.sizes.base,
    color: COLORS.textSecondary,
    textAlign: "center",
    marginTop: SPACING.lg,
  },
  subTitle: {
    fontSize: FONTS.sizes["2xl"],
    fontWeight: FONTS.weights.bold,
    color: COLORS.text,
    textAlign: "center",
    marginVertical: SPACING.sm,
  },
  description: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.textSecondary,
    textAlign: "center",
    lineHeight: 22,
  },
  asconBanner: {
    backgroundColor: `${COLORS.surfaceLight}CC`,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    borderColor: `${COLORS.primary}33`,
    overflow: "hidden",
  },
  asconContent: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
  },
  asconIcon: {
    marginRight: SPACING.md,
  },
  asconText: {
    flex: 1,
  },
  asconLabel: {
    fontSize: FONTS.sizes.xs,
    fontWeight: FONTS.weights.bold,
    color: COLORS.primary,
  },
  asconHash: {
    fontSize: FONTS.sizes.xs,
    color: COLORS.textTertiary,
    marginTop: 4,
    fontFamily: "monospace",
  },
  asconIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.primary,
  },
  featuresRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
  },
  featureItem: {
    alignItems: "center",
  },
  featureLabel: {
    fontSize: FONTS.sizes.xs,
    color: COLORS.textTertiary,
    marginTop: SPACING.sm,
  },
  primaryButton: {
    flexDirection: "row",
    backgroundColor: COLORS.primary,
    borderRadius: 30,
    paddingVertical: SPACING.lg,
    paddingHorizontal: SPACING.xl,
    justifyContent: "center",
    alignItems: "center",
    elevation: 8,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 15,
  },
  primaryButtonText: {
    fontSize: FONTS.sizes.lg,
    fontWeight: FONTS.weights.bold,
    color: COLORS.background,
    marginRight: SPACING.sm,
  },
  buttonIcon: {
    color: COLORS.background,
  },
  footerText: {
    fontSize: FONTS.sizes.xs,
    color: `${COLORS.text}33`,
    textAlign: "center",
  },
});
