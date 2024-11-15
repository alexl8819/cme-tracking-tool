import { useContext, useState, useEffect, createContext, type PropsWithChildren } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';
import { router } from 'expo-router';

import { supabase } from '../lib/client';
import { deriveEncryptionKey, toBytes, toHexValue } from '../lib/crypto';

const AuthContext = createContext<{
  signIn: () => void;
  signOut: () => void;
  createSessionKey: () => void;
  session?: object | null;
  derivedKey?: Uint8Array | null;
  isLoading: boolean;
}>({
  signIn: () => null,
  signOut: () => null,
  createSessionKey: () => null,
  session: null,
  derivedKey: null,
  isLoading: false
});

export function useSession () {
  const value = useContext(AuthContext);

  if (process.env.NODE_ENV !== 'production') {
    if (!value) {
      throw new Error('useSession must be wrapped in a <SessionProvider />');
    }
  }

  return value;
}

export function SessionProvider({ children }: PropsWithChildren) {
  const [_p, _setP] = useState<string | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [derivedKey, setDerivedKey] = useState<Uint8Array | null>(null);

  useEffect(() => {
    supabase.auth.onAuthStateChange((_event, session) => {
      console.log('session changed');
      setSession(session ? session : null);
      console.log(session);
      setIsLoading(false);
      router.navigate('/dashboard');
    });
    const checkKeyExists = async () => {
      const savedKey = await AsyncStorage.getItem('dk');
      if (savedKey) {
        console.log(`Found existing derivedKey: ${savedKey}`);
        setDerivedKey(toBytes(savedKey));
      }
    };
    checkKeyExists();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        signIn: async (credentials) => {
          // Perform sign-in logic here
          console.log('sign in called')
          const { error } = await supabase.auth.signInWithPassword(credentials);
          
          if (error) {
            Alert.alert(error.message);
            return;
          }
          // Temporarily save plaintext password for key derivation
          // Only happens during initial sign-in and signup
          _setP(credentials.password);
        },
        signOut: async () => {
          console.log('signed out called');
          const { error } = await supabase.auth.signOut();
          
          if (error) {
            console.error(error);
          }

          await AsyncStorage.removeItem('dk');
        },
        createSessionKey: async (seed) => {
          if (!_p) {
            throw new Error('plaintext is null');
          }

          const { key, salt } = await deriveEncryptionKey(_p, seed);
          const keyHex = toHexValue(key);
          await AsyncStorage.setItem('dk', keyHex); 
          _setP(null);
          setDerivedKey(key);

          return salt;
        },
        session,
        derivedKey,
        isLoading,
      }}>
      {children}
    </AuthContext.Provider>
  );
}
