import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
  ActivityIndicator,
  Modal,
} from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "../../context/AuthContext";
import { useTranslation } from "../../hooks/useTranslation";
import { COLORS, SPACING, BORDER_RADIUS, FONTS } from "../../constants/design";
import { MaterialIcons } from "@expo/vector-icons";

export default function SettingsScreen() {
  const router = useRouter();
  const { logout, changePassword, updateLanguage, user } = useAuth();
  const { t, language } = useTranslation();
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChangePassword = async () => {
    if (!oldPassword || !newPassword || !confirmPassword) {
      Alert.alert(t("error"), t("fill_all_fields"));
      return;
    }

    if (newPassword.length < 6) {
      Alert.alert(t("error"), t("password_short"));
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert(t("error"), t("passwords_no_match"));
      return;
    }

    setLoading(true);
    try {
      await changePassword(oldPassword, newPassword);
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setShowPasswordModal(false);
      Alert.alert(t("success"), t("success_change"));
    } catch (error: any) {
      if (!error?.response) {
        Alert.alert(t("error"), t("network_error"));
      } else if (error?.response?.status === 401) {
        Alert.alert(t("error"), t("wrong_current_pass"));
      } else {
        Alert.alert(t("error"), error?.response?.data?.error || t("change_pass_failed"));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLanguageChange = async (lang: string) => {
    setLoading(true);
    try {
      await updateLanguage(lang);
      setShowLanguageModal(false);
    } catch (error: any) {
      if (!error?.response) {
        Alert.alert(t("error"), t("network_error"));
      } else {
        Alert.alert(t("error"), error?.response?.data?.error || t("lang_update_failed"));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    Alert.alert(t("logout"), t("logout_confirm"), [
      { text: t("cancel"), style: "cancel" },
      {
        text: t("logout"),
        style: "destructive",
        onPress: async () => {
          try {
            await logout();
            router.replace("/auth/login");
          } catch (error) {
            console.error("Logout error:", error);
            Alert.alert(t("error"), t("logout_failed"));
          }
        },
      },
    ]);
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t("settings")}</Text>
        <Text style={styles.headerSubtitle}>{user?.email}</Text>
      </View>

      <View style={styles.content}>
        {/* Profile Card */}
        <View style={styles.profileCard}>
          <MaterialIcons
            name="account-circle"
            size={60}
            color={COLORS.primary}
          />
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{user?.email}</Text>
            <Text style={styles.profileStatus}>{t("sec_platform")}</Text>
          </View>
        </View>

        <View style={styles.spacer} />

        {/* Settings Menu */}
        <SettingItem
          icon="lock-outline"
          label={t("change_pass")}
          onPress={() => setShowPasswordModal(true)}
        />

        <SettingItem
          icon="translate"
          label={t("lang")}
          onPress={() => setShowLanguageModal(true)}
          value={language.toUpperCase()}
        />

        <SettingItem
          icon="info-outline"
          label={t("about")}
          onPress={() => {
            // Navigate to about page
            Alert.alert(t("pfe_title"), t("about_desc"));
          }}
        />

        <View style={styles.divider} />

        <SettingItem
          icon="logout"
          label={t("logout")}
          onPress={handleLogout}
          color={COLORS.danger}
          isDangerous
        />

        <View style={styles.spacer} />
        <Text style={styles.footerText}>{t("dev_by")}</Text>
        <View style={styles.spacer} />
      </View>

      {/* Password Change Modal */}
      <Modal visible={showPasswordModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t("change_pass")}</Text>
              <TouchableOpacity onPress={() => setShowPasswordModal(false)}>
                <MaterialIcons name="close" size={24} color={COLORS.text} />
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.input}
              placeholder={t("old_pass")}
              placeholderTextColor={COLORS.textTertiary}
              secureTextEntry
              value={oldPassword}
              onChangeText={setOldPassword}
              editable={!loading}
            />

            <TextInput
              style={styles.input}
              placeholder={t("new_pass")}
              placeholderTextColor={COLORS.textTertiary}
              secureTextEntry
              value={newPassword}
              onChangeText={setNewPassword}
              editable={!loading}
            />

            <TextInput
              style={styles.input}
              placeholder={t("confirm_pass")}
              placeholderTextColor={COLORS.textTertiary}
              secureTextEntry
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              editable={!loading}
            />

            <TouchableOpacity
              style={[
                styles.modalButton,
                loading && styles.modalButtonDisabled,
              ]}
              onPress={handleChangePassword}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color={COLORS.text} />
              ) : (
                <Text style={styles.modalButtonText}>{t("save")}</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Language Modal */}
      <Modal visible={showLanguageModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t("lang")}</Text>
              <TouchableOpacity onPress={() => setShowLanguageModal(false)}>
                <MaterialIcons name="close" size={24} color={COLORS.text} />
              </TouchableOpacity>
            </View>

            {["en", "ar", "fr"].map((lang) => (
              <TouchableOpacity
                key={lang}
                style={[
                  styles.languageOption,
                  language === lang && styles.languageOptionActive,
                ]}
                onPress={() => handleLanguageChange(lang)}
                disabled={loading}
              >
                <Text
                  style={[
                    styles.languageOptionText,
                    language === lang && styles.languageOptionTextActive,
                  ]}
                >
                  {lang === "en"
                    ? "English"
                    : lang === "ar"
                      ? "العربية"
                      : "Français"}
                </Text>
                {language === lang && (
                  <MaterialIcons
                    name="check"
                    size={20}
                    color={COLORS.primary}
                  />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const SettingItem = ({
  icon,
  label,
  value,
  onPress,
  color,
  isDangerous,
}: any) => (
  <TouchableOpacity style={styles.settingItem} onPress={onPress}>
    <View style={styles.settingLeft}>
      <View
        style={[
          styles.settingIcon,
          {
            backgroundColor: isDangerous
              ? COLORS.danger + "20"
              : COLORS.primary + "20",
          },
        ]}
      >
        <MaterialIcons
          name={icon as any}
          size={22}
          color={color || COLORS.primary}
        />
      </View>
      <Text style={[styles.settingLabel, color && { color }]}>{label}</Text>
    </View>

    <View style={styles.settingRight}>
      {value && <Text style={styles.settingValue}>{value}</Text>}
      <MaterialIcons
        name="arrow-forward-ios"
        size={12}
        color={COLORS.textSecondary}
      />
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
  profileCard: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    flexDirection: "row",
    alignItems: "center",
  },
  profileInfo: {
    marginLeft: SPACING.lg,
    flex: 1,
  },
  profileName: {
    fontSize: FONTS.sizes.base,
    fontWeight: FONTS.weights.bold,
    color: COLORS.text,
  },
  profileStatus: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },
  settingItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.md,
    marginBottom: SPACING.sm,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    borderColor: `${COLORS.text}1A`,
  },
  settingLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  settingIcon: {
    width: 40,
    height: 40,
    borderRadius: BORDER_RADIUS.sm,
    justifyContent: "center",
    alignItems: "center",
    marginRight: SPACING.md,
  },
  settingLabel: {
    fontSize: FONTS.sizes.base,
    fontWeight: FONTS.weights.medium,
    color: COLORS.text,
  },
  settingRight: {
    flexDirection: "row",
    alignItems: "center",
  },
  settingValue: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.primary,
    marginRight: SPACING.md,
    fontWeight: FONTS.weights.bold,
  },
  divider: {
    height: 1,
    backgroundColor: `${COLORS.text}1A`,
    marginVertical: SPACING.lg,
  },
  footerText: {
    textAlign: "center",
    fontSize: FONTS.sizes.xs,
    color: `${COLORS.text}33`,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: COLORS.background,
    borderTopLeftRadius: BORDER_RADIUS.xl,
    borderTopRightRadius: BORDER_RADIUS.xl,
    padding: SPACING.lg,
    paddingBottom: SPACING.xl,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: SPACING.lg,
  },
  modalTitle: {
    fontSize: FONTS.sizes.lg,
    fontWeight: FONTS.weights.bold,
    color: COLORS.text,
  },
  input: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.sm,
    borderWidth: 1,
    borderColor: `${COLORS.text}1A`,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    fontSize: FONTS.sizes.base,
    color: COLORS.text,
  },
  modalButton: {
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.sm,
    paddingVertical: SPACING.lg,
    alignItems: "center",
    marginTop: SPACING.md,
  },
  modalButtonDisabled: {
    opacity: 0.7,
  },
  modalButtonText: {
    fontSize: FONTS.sizes.base,
    fontWeight: FONTS.weights.bold,
    color: COLORS.background,
  },
  languageOption: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.md,
    marginBottom: SPACING.sm,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.sm,
    borderWidth: 1,
    borderColor: `${COLORS.text}1A`,
  },
  languageOptionActive: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary + "15",
  },
  languageOptionText: {
    fontSize: FONTS.sizes.base,
    color: COLORS.text,
  },
  languageOptionTextActive: {
    fontWeight: FONTS.weights.bold,
    color: COLORS.primary,
  },
});
