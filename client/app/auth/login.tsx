import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "../../context/AuthContext";
import { useTranslation } from "../../hooks/useTranslation";
import { COLORS, SPACING, BORDER_RADIUS, FONTS } from "../../constants/design";
import { MaterialIcons } from "@expo/vector-icons";
import { hashAscon, strToBytes, toHex } from "../../utils/ascon";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const EMPTY_HASH = "0000000000000000000000000000";

export default function LoginScreen() {
  const router = useRouter();
  const { login, isLoading } = useAuth();
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [visualHash, setVisualHash] = useState(EMPTY_HASH);
  const [formError, setFormError] = useState("");

  const handlePasswordChange = (text: string) => {
    setPassword(text);
    if (!text) {
      setVisualHash(EMPTY_HASH);
    } else {
      const h = toHex(hashAscon(strToBytes(text)));
      setVisualHash(h.slice(0, 28));
    }
  };

  const handleLogin = async () => {
    if (!email || !password) {
      setFormError(t("fill_all_fields"));
      return;
    }

    if (!EMAIL_REGEX.test(email)) {
      setFormError(t("invalid_email"));
      return;
    }

    try {
      setFormError("");
      await login(email, password);
      router.replace("/app/dashboard");
    } catch (error: any) {
      if (!error?.response) {
        setFormError(t("network_error"));
        return;
      }

      if (error?.response?.status === 401) {
        setFormError(t("invalid_credentials"));
        return;
      }

      setFormError(error?.response?.data?.error || t("login_failed"));
    }
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.content}>
        {/* Header with back button */}
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <MaterialIcons name="arrow-back-ios" size={20} color={COLORS.text} />
        </TouchableOpacity>

        {/* Logo */}
        <View style={styles.logoSection}>
          <View style={styles.logoBackground} />
          <MaterialIcons
            name="shield"
            size={90}
            color={`${COLORS.success}40`}
            style={styles.shieldIcon}
          />
          <MaterialIcons
            name="lock-outline"
            size={45}
            color={COLORS.success}
            style={styles.lockIcon}
          />
        </View>

        {/* Title */}
        <Text style={styles.title}>{t("welcome_back")}</Text>
        <Text style={styles.subtitle}>{t("sec_platform")}</Text>

        <View style={styles.spacer} />

        {/* Email Input */}
        <Text style={styles.label}>{t("email")}</Text>
        <View style={styles.inputContainer}>
          <MaterialIcons
            name="email"
            size={20}
            color={COLORS.textSecondary}
            style={styles.inputIcon}
          />
          <TextInput
            style={styles.input}
            placeholder="user@example.com"
            placeholderTextColor={COLORS.textTertiary}
            value={email}
            onChangeText={(value) => {
              setEmail(value);
              if (formError) setFormError("");
            }}
            editable={!isLoading}
            autoCapitalize="none"
            keyboardType="email-address"
          />
        </View>

        <View style={styles.spacer} />

        {/* Password Input */}
        <Text style={styles.label}>{t("pass")}</Text>
        <View style={styles.inputContainer}>
          <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
            <MaterialIcons
              name={showPassword ? "visibility" : "visibility-off"}
              size={20}
              color={COLORS.textSecondary}
              style={styles.inputIcon}
            />
          </TouchableOpacity>
          <TextInput
            style={styles.input}
            placeholder="••••••••"
            placeholderTextColor={COLORS.textTertiary}
            value={password}
            onChangeText={(value) => {
              handlePasswordChange(value);
              if (formError) setFormError("");
            }}
            secureTextEntry={!showPassword}
            editable={!isLoading}
          />
        </View>

        <View style={styles.spacer} />

        {formError ? <Text style={styles.errorText}>{formError}</Text> : null}

        {/* Login Button */}
        <TouchableOpacity
          style={[styles.loginButton, isLoading && styles.loginButtonDisabled]}
          onPress={handleLogin}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color={COLORS.text} size="small" />
          ) : (
            <Text style={styles.loginButtonText}>{t("login")}</Text>
          )}
        </TouchableOpacity>

        <View style={styles.spacer} />
        <View style={styles.spacer} />

        {/* ASCON Box */}
        <View style={styles.asconBox}>
          <View style={styles.asconHeader}>
            <MaterialIcons
              name="lock-outline"
              size={14}
              color={COLORS.primary}
            />
            <Text style={styles.asconBoxTitle}>{t("ascon_box")}</Text>
          </View>
          <View style={styles.divider} />
          <Text style={styles.asconDesc}>{t("ascon_desc")}</Text>
          <Text style={styles.asconKey}>ASCON-128 · ASCON-HASH</Text>
          <View style={styles.hashContainer}>
            <Text style={styles.hashValue}>{visualHash}</Text>
          </View>
        </View>

        <View style={styles.spacer} />

        {/* Register Link */}
        <View style={styles.registerContainer}>
          <Text style={styles.registerText}>Don't have an account? </Text>
          <TouchableOpacity onPress={() => router.push("/auth/register")}>
            <Text style={styles.registerLink}>{t("register")}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.spacer} />
        <Text style={styles.footerText}>{t("footer_text")}</Text>
        <View style={styles.spacer} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.xl,
  },
  backButton: {
    alignSelf: "flex-start",
    padding: SPACING.sm,
    marginBottom: SPACING.md,
  },
  logoSection: {
    alignItems: "center",
    marginVertical: SPACING.lg,
  },
  logoBackground: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: `${COLORS.success}0A`,
    position: "absolute",
  },
  shieldIcon: {
    position: "absolute",
  },
  lockIcon: {
    position: "absolute",
  },
  title: {
    fontSize: FONTS.sizes["2xl"],
    fontWeight: FONTS.weights.bold,
    color: COLORS.text,
    marginTop: SPACING.xl,
  },
  subtitle: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },
  spacer: {
    height: SPACING.md,
  },
  label: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.textSecondary,
    marginBottom: SPACING.sm,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.sm,
    borderWidth: 1,
    borderColor: `${COLORS.text}1A`,
    paddingHorizontal: SPACING.md,
  },
  inputIcon: {
    marginRight: SPACING.md,
  },
  input: {
    flex: 1,
    paddingVertical: SPACING.md,
    fontSize: FONTS.sizes.base,
    color: COLORS.text,
  },
  loginButton: {
    backgroundColor: COLORS.success,
    borderRadius: BORDER_RADIUS.sm,
    paddingVertical: SPACING.lg,
    alignItems: "center",
    justifyContent: "center",
  },
  loginButtonDisabled: {
    opacity: 0.7,
  },
  loginButtonText: {
    fontSize: FONTS.sizes.lg,
    fontWeight: FONTS.weights.bold,
    color: COLORS.text,
  },
  errorText: {
    color: COLORS.danger,
    fontSize: FONTS.sizes.sm,
    marginBottom: SPACING.sm,
  },
  asconBox: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    borderColor: `${COLORS.text}1A`,
    padding: SPACING.md,
  },
  asconHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: SPACING.sm,
  },
  asconBoxTitle: {
    fontSize: FONTS.sizes.sm,
    fontWeight: FONTS.weights.bold,
    color: COLORS.primary,
    marginLeft: SPACING.sm,
  },
  divider: {
    height: 1,
    backgroundColor: `${COLORS.text}1A`,
    marginVertical: SPACING.sm,
  },
  asconDesc: {
    fontSize: FONTS.sizes.xs,
    color: COLORS.textSecondary,
    textAlign: "center",
    marginBottom: SPACING.sm,
  },
  asconKey: {
    fontSize: FONTS.sizes.sm,
    fontWeight: FONTS.weights.bold,
    color: COLORS.text,
    textAlign: "center",
    marginBottom: SPACING.md,
  },
  hashContainer: {
    backgroundColor: COLORS.surfaceLight,
    borderRadius: BORDER_RADIUS.sm,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.md,
  },
  hashValue: {
    fontSize: FONTS.sizes.xs,
    color: COLORS.primary,
    fontFamily: "monospace",
    letterSpacing: 1,
    textAlign: "center",
  },
  registerContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  registerText: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.textSecondary,
  },
  registerLink: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.primary,
    fontWeight: FONTS.weights.bold,
  },
  footerText: {
    fontSize: FONTS.sizes.xs,
    color: `${COLORS.text}33`,
    textAlign: "center",
  },
});
