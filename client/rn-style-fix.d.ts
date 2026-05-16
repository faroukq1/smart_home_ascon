/**
 * Override StyleSheet.create so TypeScript preserves the exact style type
 * for each key instead of widening to `TextStyle | ViewStyle | ImageStyle`.
 * Without this, every `style={styles.foo}` prop reports TS2769.
 */
import {
  ViewStyle,
  TextStyle,
  ImageStyle,
} from "react-native";

declare module "react-native" {
  namespace StyleSheet {
    function create<T extends { [K in keyof T]: ViewStyle | TextStyle | ImageStyle }>(
      styles: T
    ): T;
  }
}
