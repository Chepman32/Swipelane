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
        console.error(`Error reading ${key} from storage`, error);
      }
    };

    getItem();
  }, [key]);

  const setValue = async (value: T | ((val: T) => T)) => {
    try {
      const valueToStore =
        value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      await StorageInitializer.initialize();
      await AsyncStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.error(`Error setting ${key} in storage`, error);
    }
  };

  const removeValue = async () => {
    try {
      await StorageInitializer.initialize();
      await AsyncStorage.removeItem(key);
      setStoredValue(initialValue);
    } catch (error) {
      console.error(`Error removing ${key} from storage`, error);
    }
  };

  return [storedValue, setValue, removeValue] as const;
};

export default useStorage;
