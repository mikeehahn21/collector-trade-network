import React from 'react';
import { Slot } from 'expo-router';
import { View } from 'react-native';

export default function RootLayout() {
  return (
    <View style={{ flex: 1, backgroundColor: '#0F1115' }}>
      <Slot />
    </View>
  );
}
