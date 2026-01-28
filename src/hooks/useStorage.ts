import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import StorageInitializer from '../utils/storageInit';

export const useStorage = <T>(key: string, initialValue: T) => {
  const [storedValue, setStoredValue] = useState<T>(initialValue);

  useEffect(() => {
    const getItem = async () => {
      try {
        await StorageInitializer.initialize();
        const item = await AsyncStorage.getItem(key);
        if (item !== null) {
          setStoredValue(JSON.parse(item));
        }
      } catch (error) {
        const repaired = await StorageInitializer.repairFromError(error);
        if (repaired) {
          try {
            const item = await AsyncStorage.getItem(key);
            if (item !== null) {
              setStoredValue(JSON.parse(item));
            }
            return;
          } catch (retryError) {
            console.error(`Error reading ${key} from storage after repair`, retryError);
          }
        }
        console.error(`Error reading ${key} from storage`, error);
      }
    };

    getItem();
  }, [key]);

  const setValue = async (value: T | ((val: T) => T)) => {
    const valueToStore =
      value instanceof Function ? value(storedValue) : value;
    try {
      setStoredValue(valueToStore);
      await StorageInitializer.initialize();
      await AsyncStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      const repaired = await StorageInitializer.repairFromError(error);
      if (repaired) {
        try {
          await AsyncStorage.setItem(key, JSON.stringify(valueToStore));
          return;
        } catch (retryError) {
          console.error(`Error setting ${key} in storage after repair`, retryError);
        }
      }
      console.error(`Error setting ${key} in storage`, error);
    }
  };

  const removeValue = async () => {
    try {
      await StorageInitializer.initialize();
      await AsyncStorage.removeItem(key);
      setStoredValue(initialValue);
    } catch (error) {
      const repaired = await StorageInitializer.repairFromError(error);
      if (repaired) {
        try {
          await AsyncStorage.removeItem(key);
          setStoredValue(initialValue);
          return;
        } catch (retryError) {
          console.error(`Error removing ${key} from storage after repair`, retryError);
        }
      }
      console.error(`Error removing ${key} from storage`, error);
    }
  };

  return [storedValue, setValue, removeValue] as const;
};

export default useStorage;
