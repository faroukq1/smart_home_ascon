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

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function RegisterScreen() {
  const router = useRouter();
  const { register, isLoading } = useAuth();
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [language, setLanguage] = useState("en");
  const [formError, setFormError] = useState("");

  const handleRegister = async () => {
    if (!email || !password || !confirmPassword) {
      setFormError(t("fill_all_fields"));
      return;
    }

    if (!EMAIL_REGEX.test(email)) {
      setFormError(t("invalid_email"));
      return;
    }

    if (password !== confirmPassword) {
      setFormError(t("passwords_no_match"));
      return;
    }

    if (password.length < 6) {
      setFormError(t("password_short"));
      return;
    }

    try {
      setFormError("");
      await register(email, password, language);
      router.replace("/app/dashboard");
    } catch (error: any) {
      if (!error?.response) {
        setFormError(t("network_error"));
        return;
      }

      if (error?.response?.status === 400) {
        setFormError(t("email_exists"));
        return;
      }

      setFormError(error?.response?.data?.error || t("register_failed"));
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

        {/* Title */}
        <Text style={styles.title}>{t("register")}</Text>
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
        <Text style={styles.label}>{t("new_pass")}</Text>
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
              setPassword(value);
              if (formError) setFormError("");
            }}
            secureTextEntry={!showPassword}
            editable={!isLoading}
          />
        </View>

        <View style={styles.spacer} />

        {/* Confirm Password Input */}
        <Text style={styles.label}>{t("confirm_pass")}</Text>
        <View style={styles.inputContainer}>
          <MaterialIcons
            name="check-circle"
            size={20}
            color={COLORS.textSecondary}
            style={styles.inputIcon}
          />
          <TextInput
            style={styles.input}
            placeholder="••••••••"
            placeholderTextColor={COLORS.textTertiary}
            value={confirmPassword}
            onChangeText={(value) => {
              setConfirmPassword(value);
              if (formError) setFormError("");
            }}
            secureTextEntry={true}
            editable={!isLoading}
          />
        </View>

        <View style={styles.spacer} />

        {/* Language Selector */}
        <Text style={styles.label}>{t("lang")}</Text>
        <View style={styles.languageSelector}>
          {["en", "ar", "fr"].map((lang) => (
            <TouchableOpacity
              key={lang}
              style={[
                styles.langButton,
                language === lang && styles.langButtonActive,
              ]}
              onPress={() => setLanguage(lang)}
            >
              <Text
                style={[
                  styles.langButtonText,
                  language === lang && styles.langButtonTextActive,
                ]}
              >
                {lang.toUpperCase()}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.spacer} />

        {formError ? <Text style={styles.errorText}>{formError}</Text> : null}
        <View style={styles.spacer} />

        {/* Register Button */}
        <TouchableOpacity
          style={[
            styles.registerButton,
            isLoading && styles.registerButtonDisabled,
          ]}
          onPress={handleRegister}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color={COLORS.text} size="small" />
          ) : (
            <Text style={styles.registerButtonText}>{t("register")}</Text>
          )}
        </TouchableOpacity>

        <View style={styles.spacer} />

        {/* Login Link */}
        <View style={styles.loginContainer}>
          <Text style={styles.loginText}>Already have an account? </Text>
          <TouchableOpacity onPress={() => router.push("/auth/login")}>
            <Text style={styles.loginLink}>{t("login")}</Text>
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
  title: {
    fontSize: FONTS.sizes["2xl"],
    fontWeight: FONTS.weights.bold,
    color: COLORS.text,
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
  languageSelector: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  langButton: {
    flex: 1,
    marginHorizontal: SPACING.xs,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.md,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.sm,
    borderWidth: 1,
    borderColor: `${COLORS.text}1A`,
    alignItems: "center",
  },
  langButtonActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  langButtonText: {
    fontSize: FONTS.sizes.sm,
    fontWeight: FONTS.weights.bold,
    color: COLORS.textSecondary,
  },
  langButtonTextActive: {
    color: COLORS.background,
  },
  registerButton: {
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.sm,
    paddingVertical: SPACING.lg,
    alignItems: "center",
    justifyContent: "center",
  },
  registerButtonDisabled: {
    opacity: 0.7,
  },
  registerButtonText: {
    fontSize: FONTS.sizes.lg,
    fontWeight: FONTS.weights.bold,
    color: COLORS.background,
  },
  errorText: {
    color: COLORS.danger,
    fontSize: FONTS.sizes.sm,
    marginBottom: SPACING.sm,
  },
  loginContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  loginText: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.textSecondary,
  },
  loginLink: {
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
