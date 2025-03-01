import React, { useEffect, useState } from "react";
import { View, Text, Alert, StyleSheet } from "react-native";
import { GestureDetector, Gesture } from "react-native-gesture-handler";
import { Linking } from "react-native";
import * as Haptics from "expo-haptics";
import * as tf from "@tensorflow/tfjs";
import "@tensorflow/tfjs-react-native";
import * as handpose from "@tensorflow-models/handpose";

const openApp = async (appType) => {
  try {
    let url;
    switch (appType) {
      case "camera":
        const cameraUrls = [
          "camera://",
          "photos-redirect://",
          "instagram://camera",
          "snapchat://camera",
        ];

        for (const cameraUrl of cameraUrls) {
          const canOpen = await Linking.canOpenURL(cameraUrl);
          if (canOpen) {
            url = cameraUrl;
            break;
          }
        }
        break;

      case "browser":
        const browserUrls = [
          "googlechrome://",
          "chrome://",
          "https://www.google.com",
        ];

        for (const browserUrl of browserUrls) {
          const canOpen = await Linking.canOpenURL(browserUrl);
          if (canOpen) {
            url = browserUrl;
            break;
          }
        }
        break;
    }

    if (url) {
      await Linking.openURL(url);
    } else {
      if (appType === "camera") {
        Alert.alert("Opening Default Camera");
        await Linking.openURL("exp://camera");
      } else {
        Alert.alert("Opening Default Browser");
        await Linking.openURL("https://www.google.com");
      }
    }
  } catch (error) {
    console.log("URL opening error:", error);
    Alert.alert("Notice", `Unable to open ${appType}`);
  }
};

const detectShape = (points) => {
  const xCoords = points.map((p) => p.x);
  const yCoords = points.map((p) => p.y);

  const width = Math.max(...xCoords) - Math.min(...xCoords);
  const height = Math.max(...yCoords) - Math.min(...yCoords);

  if (Math.abs(width - height) < 50) {
    if (points.length > 20) return "C";
    return "B";
  }
  return "Unknown";
};

export default function GestureScreen() {
  const [gestureType, setGestureType] = useState("");
  const [model, setModel] = useState(null);
  const [gesturePath, setGesturePath] = useState([]);
  const [isModelReady, setIsModelReady] = useState(false);

  useEffect(() => {
    const setupTensorFlow = async () => {
      try {
        await tf.ready();
        await tf.setBackend("cpu");
        const handposeModel = await handpose.load({
          maxContinuousChecks: 5,
          detectionConfidence: 0.8,
        });
        setModel(handposeModel);
        setIsModelReady(true);
        console.log("TensorFlow and Handpose Model Ready");
      } catch (error) {
        console.log("Model initialization error:", error);
        Alert.alert("Setup Notice", "Running in basic gesture mode");
      }
    };

    setupTensorFlow();
  }, []);

  const recognizeGesture = async (gestureData) => {
    if (gestureData.length < 2) return;

    try {
      const shape = detectShape(gestureData);
      setGestureType(shape);

      switch (shape) {
        case "C":
          await Haptics.notificationAsync(
            Haptics.NotificationFeedbackType.Success
          );
          await openApp("camera");
          break;
        case "B":
          await Haptics.notificationAsync(
            Haptics.NotificationFeedbackType.Success
          );
          await openApp("browser");
          break;
      }
    } catch (error) {
      console.log("Recognition error:", error);
    }
  };

  const tapGesture = Gesture.Tap()
    .maxDuration(250)
    .numberOfTaps(1)
    .onStart(async () => {
      setGestureType("Tap");
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      await openApp("browser");
    })
    .runOnJS(true);

  const panGesture = Gesture.Pan()
    .minDistance(10)
    .onStart(() => {
      setGesturePath([]);
      setGestureType("Drawing");
    })
    .onUpdate((event) => {
      setGesturePath((prevPath) => [...prevPath, { x: event.x, y: event.y }]);
    })
    .onEnd(async () => {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      await recognizeGesture(gesturePath);
    })
    .runOnJS(true);

  const composedGesture = Gesture.Exclusive(tapGesture, panGesture);

  return (
    <GestureDetector gesture={composedGesture}>
      <View style={styles.container}>
        <Text style={styles.status}>
          System Status: {isModelReady ? "✅ Ready" : "⚙️ Initializing"}
        </Text>
        <Text style={styles.text}>Current Gesture: {gestureType}</Text>
        <View style={styles.instructionsContainer}>
          <Text style={styles.instructions}>👆 Tap → Launch Browser</Text>
          <Text style={styles.instructions}>✍️ Draw "C" → Launch Camera</Text>
          <Text style={styles.instructions}>✍️ Draw "B" → Launch Browser</Text>
        </View>
        {gesturePath.length > 0 && (
          <Text style={styles.progress}>Recording Gesture...</Text>
        )}
      </View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f8f8f8",
    padding: 20,
  },
  status: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 20,
    color: "#2196F3",
  },
  text: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 15,
    textAlign: "center",
  },
  instructionsContainer: {
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    elevation: 5,
  },
  instructions: {
    fontSize: 16,
    color: "#333",
    marginVertical: 5,
  },
  progress: {
    marginTop: 20,
    color: "#4CAF50",
    fontWeight: "bold",
  },
});
