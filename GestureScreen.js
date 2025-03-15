import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  Linking,
  Alert,
} from "react-native";
import { GestureDetector, Gesture } from "react-native-gesture-handler";
import * as Haptics from "expo-haptics";
import Svg, { Path } from "react-native-svg";

const { width, height } = Dimensions.get("window");

const openApp = async (appType) => {
  const appSchemes = {
    instagram: "instagram://",
    snapchat: "snapchat://",
    whatsapp: "whatsapp://",
    camera: "camera://",
  };

  try {
    const url = appSchemes[appType];
    const canOpen = await Linking.canOpenURL(url);
    if (canOpen) {
      await Linking.openURL(url);
    } else {
      Alert.alert(
        "App Not Found",
        "Please install the app to use this feature"
      );
    }
  } catch (error) {
    Alert.alert("Error", "Unable to open app");
  }
};

export default function GestureScreen() {
  const [gestureType, setGestureType] = useState("");
  const [gesturePath, setGesturePath] = useState([]);
  const [pathString, setPathString] = useState("");
  const [currentLetter, setCurrentLetter] = useState("");

  const createPathString = (points) => {
    if (points.length < 1) return "";
    const start = points[0];
    let path = `M ${start.x} ${start.y}`;
    points.slice(1).forEach((point) => {
      path += ` L ${point.x} ${point.y}`;
    });
    return path;
  };

  const detectDrawnLetter = (points) => {
    if (points.length < 10) return "";

    const startPoint = points[0];
    const endPoint = points[points.length - 1];
    const verticalDistance = Math.abs(endPoint.y - startPoint.y);
    const horizontalDistance = Math.abs(endPoint.x - startPoint.x);

    // Detect letter patterns
    if (verticalDistance > horizontalDistance * 1.5) {
      setCurrentLetter("I");
      return "I";
    }

    if (
      points.length > 30 &&
      Math.abs(endPoint.y - startPoint.y) < height * 0.3
    ) {
      setCurrentLetter("S");
      return "S";
    }

    if (points.length > 20 && horizontalDistance > verticalDistance) {
      setCurrentLetter("W");
      return "W";
    }

    setCurrentLetter("C");
    return "C";
  };

  const panGesture = Gesture.Pan()
    .minDistance(10)
    .onStart(() => {
      setGesturePath([]);
      setPathString("");
      setGestureType("Drawing");
      setCurrentLetter("");
    })
    .onUpdate((event) => {
      const newPoint = { x: event.x, y: event.y };
      setGesturePath((prev) => {
        const updatedPath = [...prev, newPoint];
        setPathString(createPathString(updatedPath));
        detectDrawnLetter(updatedPath);
        return updatedPath;
      });
    })
    .onEnd(async () => {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      const letter = detectDrawnLetter(gesturePath);

      switch (letter) {
        case "I":
          await openApp("instagram");
          break;
        case "S":
          await openApp("snapchat");
          break;
        case "W":
          await openApp("whatsapp");
          break;
        case "C":
          await openApp("camera");
          break;
      }

      setTimeout(() => {
        setPathString("");
        setGesturePath([]);
        setCurrentLetter("");
      }, 1000);
    })
    .runOnJS(true);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Gesture Launcher</Text>
        <Text style={styles.subtitle}>Draw Letters to Launch Apps</Text>
      </View>

      <GestureDetector gesture={panGesture}>
        <View style={styles.gestureArea}>
          <Svg style={StyleSheet.absoluteFill}>
            <Path
              d={pathString}
              stroke="#4A90E2"
              strokeWidth={4}
              strokeLinejoin="round"
              strokeLinecap="round"
              fill="none"
            />
          </Svg>

          {!pathString && (
            <View style={styles.placeholderContainer}>
              <Text style={styles.placeholderText}>Draw a Letter</Text>
              <Text style={styles.placeholderSubtext}>
                {currentLetter ? `Detected: ${currentLetter}` : "I, S, W, or C"}
              </Text>
            </View>
          )}
        </View>
      </GestureDetector>

      <View style={styles.infoContainer}>
        <View style={styles.instructionsCard}>
          <Text style={styles.instructionTitle}>Draw Letters to Launch</Text>
          <View style={styles.instruction}>
            <Text style={styles.instructionIcon}>📱</Text>
            <Text style={styles.instructionText}>Draw "I" for Instagram</Text>
          </View>
          <View style={styles.instruction}>
            <Text style={styles.instructionIcon}>👻</Text>
            <Text style={styles.instructionText}>Draw "S" for Snapchat</Text>
          </View>
          <View style={styles.instruction}>
            <Text style={styles.instructionIcon}>💬</Text>
            <Text style={styles.instructionText}>Draw "W" for WhatsApp</Text>
          </View>
          <View style={styles.instruction}>
            <Text style={styles.instructionIcon}>📸</Text>
            <Text style={styles.instructionText}>Draw "C" for Camera</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F6FA",
  },
  header: {
    paddingVertical: 25,
    alignItems: "center",
    backgroundColor: "#4A90E2",
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 5,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#fff",
    letterSpacing: 1,
  },
  subtitle: {
    fontSize: 18,
    color: "#fff",
    opacity: 0.9,
    marginTop: 5,
  },
  gestureArea: {
    flex: 1,
    backgroundColor: "#ffffff",
    margin: 20,
    borderRadius: 25,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  placeholderContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  placeholderText: {
    fontSize: 24,
    color: "#4A90E2",
    fontWeight: "600",
  },
  placeholderSubtext: {
    fontSize: 16,
    color: "#8E8E93",
    marginTop: 8,
  },
  infoContainer: {
    padding: 20,
    paddingBottom: 30,
  },
  instructionsCard: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  instructionTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#4A90E2",
    marginBottom: 20,
    textAlign: "center",
  },
  instruction: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F5",
  },
  instructionIcon: {
    fontSize: 26,
    width: 40,
    marginRight: 15,
  },
  instructionText: {
    fontSize: 17,
    color: "#2C3E50",
    flex: 1,
    fontWeight: "500",
  },
});
