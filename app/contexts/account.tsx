import { useContext, useState, createContext, type PropsWithChildren } from 'react';
// import { Worklets, useSharedValue } from 'react-native-worklets-core';
import { getAccountInfo } from '../lib/fetch/accounts';

const AccountContext = createContext<{
  getInfo: () => void;
  seed?: string | null;
  renewalDate?: Date | null;
  currentReqs?: object | null;
}>({
  getInfo: () => null,
  seed: null,
  renewalDate: null,
  currentReqs: null,
});

export function useAccount () {
  const value = useContext(AccountContext);

  if (process.env.NODE_ENV !== 'production') {
    if (!value) {
      throw new Error('useAccount must be wrapped in a <AccountProvider />');
    }
  }

  return value;
}

export function AccountProvider({ children }: PropsWithChildren) {
  const [renewalDate, setRenewalDate] = useState<Date | null>(null);
  const [currentReqs, setCurrentReqs] = useState<T | null>(null);
  const [seed, setSeed] = useState<Uint8Array | null>(null);

  return (
    <AccountContext.Provider
      value={{
        getInfo: () => {
          const curYear = new Date().getFullYear();
          return async (authToken) => {
            const account = await getAccountInfo()(authToken);
            const currentReqs = account.states.requirements.find((req) => req.year === curYear);
            setCurrentReqs(currentReqs);
            setRenewalDate(Date.parse(account.renewalDate))
            setSeed(account.seed);
          }
        },
        seed,
        renewalDate,
        currentReqs,
      }}>
      {children}
    </AccountContext.Provider>
  );
}
