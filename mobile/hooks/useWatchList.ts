import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'health:watchlist';

export function useWatchList() {
  const [watchList, setWatchList] = useState<string[]>([]);

  useEffect(() => {
    AsyncStorage.getItem(KEY).then(raw => {
      if (raw) setWatchList(JSON.parse(raw) as string[]);
    });
  }, []);

  const save = useCallback(async (next: string[]) => {
    setWatchList(next);
    await AsyncStorage.setItem(KEY, JSON.stringify(next));
  }, []);

  const toggle = useCallback((labName: string) => {
    setWatchList(prev => {
      const next = prev.includes(labName)
        ? prev.filter(n => n !== labName)
        : [...prev, labName];
      AsyncStorage.setItem(KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const isWatching = useCallback((labName: string) => watchList.includes(labName), [watchList]);

  return { watchList, toggle, isWatching, save };
}
