import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import * as Linking from 'expo-linking';

const prefix = Linking.createURL('/');

export default function RootLayout() {
  useFrameworkReady();

  return (
    <>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="join/[groupId]" />
        <Stack.Screen name="group/[id]" />
        <Stack.Screen name="add-group" />
        <Stack.Screen name="add-expense-quick" />
        <Stack.Screen name="add-expense-advanced" />
        <Stack.Screen name="add-expense/[groupId]" />
        <Stack.Screen name="profile" />
        <Stack.Screen name="+not-found" />
      </Stack>
      <StatusBar style="auto" />
    </>
  );
}