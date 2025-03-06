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

    <h2>Demo: Webcam continuous detection</h2>
    <div style="margin-bottom: 20px;">
      This demo uses a model trained on the COCO dataset. It can identify 80 different classes of object in an image.
      <a href="https://github.com/amikelive/coco-labels/blob/master/coco-labels-2014_2017.txt" target="_blank">See a list of available classes</a>
    </div>
    <div id="liveView" class="videoView">
      <button @click="enableCam">
        {{ webcamRunning ? "DISABLE WEBCAM" : "ENABLE WEBCAM" }}
      </button>

      <div style="position: relative;">
        <video ref="webcam" autoplay playsinline></video>
        <div v-for="(detection, index) in detections" :key="index">
          <div class="highlighter" :style="getVideoHighlighterStyle(detection)"></div>
          <p
            class="info"
            :style="getVideoInfoStyle(detection)"
          >
            {{ detection.categories[0].categoryName }} - with
            {{ Math.round(detection.categories[0].score * 100) }}% confidence.
          </p>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { ObjectDetector, FilesetResolver } from "@mediapipe/tasks-vision";
import { ref } from "vue";

const modelLoaded = ref(false);
const detections = ref([]);

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
let runningMode = "IMAGE";

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

/********************************************************************
 // Demo 1: Grab a bunch of images from the page and detection them
 // upon click.
 ********************************************************************/

async function handleClick(event, id) {
  const item = demo1Data.value.find((i) => i.id === id);
  if (!item) return;

  if (!objectDetector) {
    alert("Object Detector is still loading. Please try again.");
    return;
  }

  if (runningMode === "VIDEO") {
    runningMode = "IMAGE";
    await objectDetector.setOptions({ runningMode: "IMAGE" });
  }

  const image = event.target;
  const ratio = image.height / image.naturalHeight;
  const result = objectDetector.detect(image);

  item.detectionResults = {
    detections: result.detections,
    ratio: ratio,
  };
}

function getHighlighterStyle(detection, ratio) {
  return {
    left: `${detection.boundingBox.originX * ratio}px`,
    top: `${detection.boundingBox.originY * ratio}px`,
    width: `${detection.boundingBox.width * ratio}px`,
    height: `${detection.boundingBox.height * ratio}px`,
  };
}

function getInfoStyle(detection, ratio) {
  return {
    left: `${detection.boundingBox.originX * ratio}px`,
    top: `${detection.boundingBox.originY * ratio}px`,
    width: `${detection.boundingBox.width * ratio - 10}px`,
  };
}

/********************************************************************
 // Demo 2: Continuously grab image from webcam stream and detect it.
 ********************************************************************/

const webcam = ref(null);
const webcamRunning = ref(false);
let stream = null;

async function enableCam() {
  if (!objectDetector) {
    console.log("Wait! objectDetector not loaded yet.");
    return;
  }

  webcamRunning.value = !webcamRunning.value;

  const constraints = { video: true };

  if (webcamRunning.value) {
    try {
      stream = await navigator.mediaDevices.getUserMedia(constraints);
      webcam.value.srcObject = stream;
      webcam.value.addEventListener("loadeddata", predictWebcam);
    } catch (err) {
      console.error("Error accessing webcam:", err);
    }
  } else {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      webcam.value.srcObject = null;
    }
  }
}

let lastVideoTime = -1;
async function predictWebcam() {
  if (runningMode === "IMAGE") {
    runningMode = "VIDEO";
    await objectDetector.setOptions({ runningMode: "VIDEO" });
  }

  const startTimeMs = performance.now();

  if (webcam.value.currentTime !== lastVideoTime) {
    lastVideoTime = webcam.value.currentTime;
    const result = await objectDetector.detectForVideo(webcam.value, startTimeMs);
    detections.value = result.detections;
  }

  if (webcamRunning.value) {
    window.requestAnimationFrame(predictWebcam);
  }
}

function getVideoHighlighterStyle(detection) {
  const video = webcam.value;
  if (!video) return {};
  const scaleX = video.offsetWidth / video.videoWidth;
  const scaleY = video.offsetHeight / video.videoHeight;
  const left = (video.videoWidth - (detection.boundingBox.originX + detection.boundingBox.width)) * scaleX;
  const top = detection.boundingBox.originY * scaleY;
  const width = detection.boundingBox.width * scaleX;
  const height = detection.boundingBox.height * scaleY;
  return {
    left: `${left}px`,
    top: `${top}px`,
    width: `${width}px`,
    height: `${height}px`,
  };
}

function getVideoInfoStyle(detection) {
  const video = webcam.value;
  if (!video) return {};
  const scaleX = video.offsetWidth / video.videoWidth;
  const scaleY = video.offsetHeight / video.videoHeight;
  const left = (video.videoWidth - (detection.boundingBox.originX + detection.boundingBox.width)) * scaleX;
  const top = detection.boundingBox.originY * scaleY;
  const width = detection.boundingBox.width * scaleX - 10;
  return {
    left: `${left}px`,
    top: `${top}px`,
    width: `${width}px`,
  };
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

.demo1-wrap {
  display: flex;
}

.detectOnClick {
  position: relative;
  width: 48%;
  margin: 2% 1%;
  cursor: pointer;
}

.detectOnClick img {
  width: 100%;
}

.videoView {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 16px;
  align-items: center;
}

.highlighter {
  background: rgba(0, 255, 0, 0.25);
  border: 1px dashed #fff;
  z-index: 1;
  position: absolute;
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
</style>