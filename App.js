import React from "react";
import { SafeAreaView } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import GestureScreen from "./GestureScreen";

export default function App() {
  console.log("✅ App Component Loaded");

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1, backgroundColor: "#2196F3" }}>
        <GestureScreen />
      </SafeAreaView>
    </GestureHandlerRootView>
  );
}
