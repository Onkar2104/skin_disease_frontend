// import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
// import { Stack } from 'expo-router';
// import { StatusBar } from 'expo-status-bar';
// import 'react-native-reanimated';

// import { useColorScheme } from '@/hooks/use-color-scheme';

// import { View } from "react-native";
// import FloatingChatButton from "../components/ChatBot/FloatingChatButton";

// export default function RootLayout() {
//   return (
//     <View style={{ flex: 1 }}>
//       <Stack screenOptions={{ headerShown: false }} />
//       <FloatingChatButton />
//     </View>
//   );
// }

// export const unstable_settings = {
//   anchor: '(tabs)',
// };

// // export default function RootLayout() {
// //   const colorScheme = useColorScheme();

// //   return (
// //     <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
// //       <Stack>
// //         <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
// //         <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
// //       </Stack>
// //       <StatusBar style="auto" />
// //     </ThemeProvider>
// //   );
// // }


// app/_layout.tsx
import { Stack } from "expo-router";
import { View } from "react-native";
import ChatWidget from "@/components/ChatBot/ChatBubble"; // Adjust path

export default function RootLayout() {
  return (
    <View style={{ flex: 1 }}>
      {/* Your standard navigation */}
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
      </Stack>
      
      {/* The Chat Widget sits here, outside the Stack */}
      <ChatWidget /> 
    </View>
  );
}