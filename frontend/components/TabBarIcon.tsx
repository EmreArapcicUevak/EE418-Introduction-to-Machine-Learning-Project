import Ionicons from '@expo/vector-icons/Ionicons';
import { ComponentProps } from 'react';
import { StyleSheet } from 'react-native';

type IoniconsProps = ComponentProps<typeof Ionicons>;

export function TabBarIcon({
  style,
  ...rest
}: IoniconsProps) {
  return <Ionicons size={28} style={[styles.icon, style]} {...rest} />;
}

const styles = StyleSheet.create({
  icon: {
    marginBottom: -3,
  },
});
