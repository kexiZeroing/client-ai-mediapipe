<template>
  <section :class="{ invisible: !isModelLoaded }">
    <h2>Demo: Webcam continuous face detection</h2>
    <div class="stats-container">
      <div class="stat-box">
        <h3>People Count: {{ peopleCount }}</h3>
      </div>
    </div>
    <div class="videoView" ref="liveView">
      <button @click="toggleWebcam">
        {{ webcamRunning ? "DISABLE PREDICTIONS" : "ENABLE PREDICTIONS" }}
      </button>
      <video ref="videoRef" autoplay playsinline></video>
      <!-- <div v-for="(detection, index) in detections" :key="index" class="highlighter" :style="getBoxStyle(detection)">
        <p>Person {{ index + 1 }}</p>
      </div> -->
    </div>
  </section>
</template>

<script setup>
import {
  FaceDetector,
  FilesetResolver,
} from "@mediapipe/tasks-vision";
import { ref } from "vue";

const videoRef = ref(null);
const isModelLoaded = ref(false);
const webcamRunning = ref(false);
const peopleCount = ref(0);
const detections = ref([]);

const detectionThreshold = 0.7;

let faceDetector;
let runningMode = "IMAGE";

const initializefaceDetector = async () => {
  const vision = await FilesetResolver.forVisionTasks("/wasm");
  faceDetector = await FaceDetector.createFromOptions(vision, {
    baseOptions: {
      modelAssetPath: `https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/1/blaze_face_short_range.tflite`,
      delegate: "GPU",
    },
    runningMode: runningMode,
  });
  isModelLoaded.value = true;
};
initializefaceDetector();

async function toggleWebcam() {
  if (!faceDetector) {
    alert("Face Detector is still loading. Please try again.");
    return;
  }

  webcamRunning.value = !webcamRunning.value;

  if (webcamRunning.value) {
    navigator.mediaDevices
      .getUserMedia({ video: true })
      .then((stream) => {
        videoRef.value.srcObject = stream;
        videoRef.value.addEventListener("loadeddata", predictWebcam);
      })
      .catch((err) => {
        console.error(err);
      });
  } else {
    if (videoRef.value.srcObject) {
      videoRef.value.srcObject.getTracks().forEach((track) => track.stop());
      videoRef.value.srcObject = null;
      detections.value = [];
      peopleCount.value = 0;
    }
  }
}

function getBoxStyle(detection) {
  const { boundingBox } = detection;
  return {
    left: `${boundingBox.originX}px`,
    top: `${boundingBox.originY}px`,
    width: `${boundingBox.width}px`,
    height: `${boundingBox.height}px`,
  };
}

let lastVideoTime = -1;

async function predictWebcam() {
  if (!webcamRunning.value) return;

  if (runningMode === "IMAGE") {
    runningMode = "VIDEO";
    await faceDetector.setOptions({ runningMode: "VIDEO" });
  }

  let startTimeMs = performance.now();

  if (videoRef.value.currentTime !== lastVideoTime) {
    lastVideoTime = videoRef.value.currentTime;
    const faceResults = faceDetector.detectForVideo(videoRef.value, startTimeMs);

    detections.value = faceResults.detections;
    peopleCount.value = detections.value.filter(d => d.categories[0].score >= detectionThreshold).length;
  }

  window.requestAnimationFrame(predictWebcam);
}
</script>

<style scoped>
video {
  display: block;
  transform: rotateY(180deg);
}

section {
  opacity: 1;
  transition: opacity 500ms ease-in-out;
}

.invisible {
  opacity: 0.2;
}

.stats-container {
  display: flex;
  justify-content: center;
  margin: 10px 0;
}

.stat-box {
  background-color: #007f8b;
  color: white;
  padding: 10px;
  border-radius: 5px;
  min-width: 150px;
  text-align: center;
}

.videoView {
  position: relative;
  width: 48%;
  margin: 2% 1%;
  cursor: pointer;
}

.videoView p {
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
</style>
