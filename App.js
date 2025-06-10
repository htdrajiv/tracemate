import React, { useState } from "react";
import {
  View,
  StyleSheet,
  Dimensions,
  Text,
  TouchableOpacity,
  Image,
  Platform,
} from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import * as ImagePicker from "expo-image-picker";
import { activateKeepAwake } from "expo-keep-awake";
import * as Brightness from "expo-brightness";
import Slider from "@react-native-community/slider";
import * as ScreenOrientation from "expo-screen-orientation";
import {
  PanGestureHandler,
  PinchGestureHandler,
  GestureHandlerRootView,
} from "react-native-gesture-handler";
import Animated, {
  useSharedValue,
  useAnimatedGestureHandler,
  useAnimatedStyle,
  runOnJS,
} from "react-native-reanimated";

const { width, height } = Dimensions.get("window");

export default function App() {
  const [permission, requestPermission] = useCameraPermissions();
  const [imageUri, setImageUri] = useState(null);
  const [opacity, setOpacity] = useState(0.5);
  const [controlsVisible, setControlsVisible] = useState(true);
  const [gridVisible, setGridVisible] = useState(true);
  const [gridSpacing, setGridSpacing] = useState(40);
  const [zoomLock, setZoomLock] = useState(true);
  const [lockedScale, setLockedScale] = useState(1);

  const scale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);

  React.useEffect(() => {
    activateKeepAwake();
    Brightness.setBrightnessAsync(1);
    ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT);
  }, []);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 1,
    });

    if (!result.canceled && result.assets.length > 0) {
      setImageUri(result.assets[0].uri);
    }
  };

  const pinchHandler = useAnimatedGestureHandler({
    onStart: (_, ctx) => {
      ctx.startScale = scale.value;
    },
    onActive: (event, ctx) => {
      scale.value = ctx.startScale * event.scale;
    },
    onEnd: () => {
      if (!zoomLock) {
        runOnJS(setLockedScale)(scale.value);
      } else {
        scale.value = lockedScale;
      }
    },
  });

  const panHandler = useAnimatedGestureHandler({
    onStart: (_, ctx) => {
      ctx.startX = translateX.value;
      ctx.startY = translateY.value;
    },
    onActive: (event, ctx) => {
      translateX.value = ctx.startX + event.translationX;
      translateY.value = ctx.startY + event.translationY;
    },
  });

  const animatedImageStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
    opacity,
  }));

  if (!permission) return <Text>Requesting camera permissions...</Text>;

  if (!permission.granted) {
    return (
      <View style={styles.center}>
        <Text>No camera access</Text>
        <TouchableOpacity onPress={requestPermission}>
          <Text style={{ color: "blue" }}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={styles.container}>
      <CameraView style={[styles.camera, { zIndex: 0 }]} facing="back" />

      {imageUri && (
        <PanGestureHandler onGestureEvent={panHandler}>
          <Animated.View style={[StyleSheet.absoluteFill, { zIndex: 2 }]}>
            <PinchGestureHandler onGestureEvent={pinchHandler}>
              <Animated.Image
                source={{ uri: imageUri }}
                style={[styles.overlayImage, animatedImageStyle]}
                resizeMode="contain"
              />
            </PinchGestureHandler>
          </Animated.View>
        </PanGestureHandler>
      )}

      {gridVisible && <GridOverlay spacing={gridSpacing} />}

      {controlsVisible && (
        <View style={styles.controls}>
          <TouchableOpacity style={styles.button} onPress={pickImage}>
            <Text style={styles.buttonText}>Pick Image</Text>
          </TouchableOpacity>

          <Text style={styles.label}>Opacity</Text>
          <Slider
            style={styles.slider}
            minimumValue={0.1}
            maximumValue={1}
            value={opacity}
            onValueChange={setOpacity}
            minimumTrackTintColor="#fff"
            thumbTintColor="#fff"
          />

          <Text style={styles.label}>Grid Spacing</Text>
          <Slider
            style={styles.slider}
            minimumValue={20}
            maximumValue={100}
            step={10}
            value={gridSpacing}
            onValueChange={setGridSpacing}
            minimumTrackTintColor="#fff"
            thumbTintColor="#fff"
          />

          <TouchableOpacity
            style={[styles.button, { marginTop: 10 }]}
            onPress={() => setGridVisible(!gridVisible)}
          >
            <Text style={styles.buttonText}>
              {gridVisible ? "Hide Grid" : "Show Grid"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, { marginTop: 10 }]}
            onPress={() => setZoomLock(!zoomLock)}
          >
            <Text style={styles.buttonText}>
              {zoomLock ? "Unlock Zoom" : "Lock Zoom"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, { marginTop: 10 }]}
            onPress={() => setControlsVisible(false)}
          >
            <Text style={styles.buttonText}>Hide UI</Text>
          </TouchableOpacity>
        </View>
      )}

      {!controlsVisible && (
        <TouchableOpacity
          onPress={() => setControlsVisible(true)}
          style={styles.showButton}
        >
          <Text style={styles.buttonText}>Show UI</Text>
        </TouchableOpacity>
      )}
    </GestureHandlerRootView>
  );
}

function GridOverlay({ spacing }) {
  const lines = [];
  for (let i = spacing; i < width; i += spacing) {
    lines.push(<View key={`v-${i}`} style={[styles.gridLine, { left: i }]} />);
  }
  for (let j = spacing; j < height; j += spacing) {
    lines.push(
      <View
        key={`h-${j}`}
        style={[styles.gridLine, { top: j, width, height: 1 }]}
      />
    );
  }
  return <View style={styles.gridContainer}>{lines}</View>;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "black",
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  camera: {
    position: "absolute",
    width: width,
    height: height,
    zIndex: 1,
  },
  overlayImage: {
    position: "absolute",
    width: width,
    height: height,
    zIndex: 2,
  },
  gridContainer: {
    position: "absolute",
    width,
    height,
    zIndex: 3,
  },
  gridLine: {
    position: "absolute",
    height: height,
    width: 1,
    backgroundColor: "rgba(255,255,255,0.2)",
  },
  controls: {
    position: "absolute",
    bottom: 40,
    width: "100%",
    alignItems: "center",
    zIndex: 4,
  },
  slider: {
    width: 300,
    marginTop: 10,
  },
  label: {
    color: "white",
    marginTop: 10,
  },
  button: {
    backgroundColor: "white",
    paddingVertical: 10,
    paddingHorizontal: 30,
    borderRadius: 10,
    marginTop: 5,
  },
  buttonText: {
    fontWeight: "bold",
    color: "black",
  },
  showButton: {
    position: "absolute",
    top: 50,
    alignSelf: "center",
    backgroundColor: "#ffffffcc",
    padding: 10,
    borderRadius: 10,
    zIndex: 5,
  },
});
