import AsyncStorage from "@react-native-async-storage/async-storage";

const KEY = "SCAN_HISTORY";

export async function saveScan(scan: any) {
  const existing = await AsyncStorage.getItem(KEY);
  const history = existing ? JSON.parse(existing) : [];
  history.unshift(scan);
  await AsyncStorage.setItem(KEY, JSON.stringify(history));
}

export async function getScans() {
  const data = await AsyncStorage.getItem(KEY);
  return data ? JSON.parse(data) : [];
}
