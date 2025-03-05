<template>
  <section id="demos" :class="{ 'invisible': !modelLoaded }">
    <h2>Demo1: Detecting Images</h2>

    <div class="demo1-wrap">
      <div class="detectOnClick" v-for="item in demo1Data" :key="item.id">
        <img
          :src="item.image"
          crossorigin="anonymous"
          @click="handleClick($event, item.id)"
        />
        <template v-if="item.detectionResults">
          <div
            class="highlighter"
            v-for="(detection, index) in item.detectionResults.detections"
            :key="index"
            :style="getHighlighterStyle(detection, item.detectionResults.ratio)"
          ></div>
          <p
            class="info"
            v-for="(detection, index) in item.detectionResults.detections"
            :key="index"
            :style="getInfoStyle(detection, item.detectionResults.ratio)"
          >
            {{ detection.categories[0].categoryName }} - with
            {{ Math.round(detection.categories[0].score * 100) }}% confidence.
          </p>
        </template>
      </div>
    </div>
  </section>
</template>

<script setup>
import { ObjectDetector, FilesetResolver } from "@mediapipe/tasks-vision";
import { ref } from "vue";

const modelLoaded = ref(false);
const demo1Data = ref([
  {
    id: 1,
    image: "https://assets.codepen.io/9177687/coupledog.jpeg",
    detectionResults: null,
  },
  {
    id: 2,
    image: "https://assets.codepen.io/9177687/doggo.jpeg",
    detectionResults: null,
  },
]);

let objectDetector;
const runningMode = "IMAGE";

// Initialize the object detector
const initializeObjectDetector = async () => {
  const vision = await FilesetResolver.forVisionTasks("/wasm");
  objectDetector = await ObjectDetector.createFromOptions(vision, {
    baseOptions: {
      modelAssetPath: `https://storage.googleapis.com/mediapipe-models/object_detector/efficientdet_lite0/float16/1/efficientdet_lite0.tflite`,
      delegate: "GPU",
    },
    scoreThreshold: 0.5,
    runningMode: runningMode,
  });
  modelLoaded.value = true;
};
initializeObjectDetector();

async function handleClick(event, id) {
  const item = demo1Data.value.find((i) => i.id === id);
  if (!item) return;

  if (!objectDetector) {
    alert("Object Detector is still loading. Please try again.");
    return;
  }

  const image = event.target;
  const ratio = image.height / image.naturalHeight;
  const result = objectDetector.detect(image);

  item.detectionResults = {
    detections: result.detections,
    ratio: ratio,
  };
}

// Compute styles for the highlighter
function getHighlighterStyle(detection, ratio) {
  return {
    left: `${detection.boundingBox.originX * ratio}px`,
    top: `${detection.boundingBox.originY * ratio}px`,
    width: `${detection.boundingBox.width * ratio}px`,
    height: `${detection.boundingBox.height * ratio}px`,
  };
}

// Compute styles for the info text
function getInfoStyle(detection, ratio) {
  return {
    left: `${detection.boundingBox.originX * ratio}px`,
    top: `${detection.boundingBox.originY * ratio}px`,
    width: `${detection.boundingBox.width * ratio - 10}px`,
  };
}
</script>

<style scoped>
section {
  opacity: 1;
  transition: opacity 500ms ease-in-out;
}

.invisible {
  opacity: 0.2;
}

.demo1-wrap {
  display: flex;
}

.detectOnClick {
  position: relative;
  width: 48%;
  margin: 2% 1%;
  cursor: pointer;
}

.info {
  position: absolute;
  padding: 5px;
  background-color: #007f8b;
  color: #fff;
  border: 1px dashed rgba(255, 255, 255, 0.7);
  z-index: 2;
  font-size: 12px;
  margin: 0;
}

.highlighter {
  background: rgba(0, 255, 0, 0.25);
  border: 1px dashed #fff;
  z-index: 1;
  position: absolute;
}

.detectOnClick img {
  width: 100%;
}
</style>