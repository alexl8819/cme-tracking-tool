import { Stack, Redirect } from 'expo-router';
import React, { useEffect } from 'react';

import { useSession } from '@/contexts/auth';

export default function AppLayout() {
  const { session } = useSession();
  
  console.log(session)

  if (!session) {
    return <Redirect href="/sign-in" />;
  }

  return (
    <Stack>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
    </Stack>
  );
}
