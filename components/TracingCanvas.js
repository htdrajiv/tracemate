import React, { useState } from "react";
import { View, Image, Slider, StyleSheet, Dimensions } from "react-native";

const { width, height } = Dimensions.get("window");

export default function TracingCanvas({ imageUri }) {
  const [opacity, setOpacity] = useState(0.8);

  return (
    <View style={styles.container}>
      <Image
        source={{ uri: imageUri }}
        style={[styles.image, { opacity }]}
        resizeMode="contain"
      />
      <Slider
        style={styles.slider}
        minimumValue={0.1}
        maximumValue={1}
        value={opacity}
        onValueChange={setOpacity}
        step={0.05}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "black",
    justifyContent: "center",
    alignItems: "center",
  },
  image: {
    width: width,
    height: height * 0.8,
  },
  slider: {
    width: 200,
    position: "absolute",
    bottom: 50,
  },
});
