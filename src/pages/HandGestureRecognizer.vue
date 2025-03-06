<template>
  <section :class="{ 'invisible': !modelLoaded }">
    <h2>Demo1: Recognize gestures</h2>

    <div class="demo1-wrap">
      <div class="detectOnClick" v-for="item in demo1Data" :key="item.id">
        <img
          :src="item.image"
          crossorigin="anonymous"
          @click="handleClick($event, item.id)"
        />
        <p class="info" v-show="item.result">{{ item.result }}</p>
      </div>
    </div>

    <h2>Demo2: Webcam continuous hand gesture detection</h2>
    <div>The default model can recognize seven classes (i.e. 👍, 👎, ✌️, ☝️, ✊, 👋, 🤟) in one or two hands.</div>

    <div id="liveView" class="videoView">
      <span id="webcamButton" @click="enableCam">
        {{ webcamRunning ? "DISABLE PREDICTIONS" : "ENABLE PREDICTIONS" }}
      </span>
      <div style="position: relative;">
        <video ref="webcam" autoplay playsinline></video>
        <canvas
          class="output_canvas"
          ref="canvasElement"
          width="1280"
          height="720"
          style="position: absolute; left: 0px; top: 0px;"
        ></canvas>
        <p id="gesture_output" class="output" v-show="gestureOutputText">
          {{ gestureOutputText }}
        </p>
      </div>
    </div>
  </section>
</template>

<script setup>
import {
  GestureRecognizer,
  FilesetResolver,
  DrawingUtils,
} from "@mediapipe/tasks-vision";
import { ref, onMounted } from "vue";

let modelLoaded = ref(false);
let demo1Data = ref([
  {
    id: 1,
    image: "https://assets.codepen.io/9177687/idea-gcbe74dc69_1920.jpg",
    result: "",
  },
  {
    id: 2,
    image: "https://assets.codepen.io/9177687/thumbs-up-ga409ddbd6_1.png",
    result: "",
  },
]);

let gestureRecognizer;
let runningMode = "IMAGE";

const createGestureRecognizer = async () => {
  const vision = await FilesetResolver.forVisionTasks("/wasm");
  gestureRecognizer = await GestureRecognizer.createFromOptions(vision, {
    baseOptions: {
      modelAssetPath:
        "https://storage.googleapis.com/mediapipe-models/gesture_recognizer/gesture_recognizer/float16/1/gesture_recognizer.task",
      delegate: "GPU",
    },
    runningMode: runningMode,
  });
  modelLoaded.value = true;
};
createGestureRecognizer();

/********************************************************************
// Demo 1: Detect hand gestures in images
********************************************************************/

async function handleClick(event, id) {
  if (!gestureRecognizer) {
    alert("Please wait for gestureRecognizer to load");
    return;
  }

  if (runningMode === "VIDEO") {
    runningMode = "IMAGE";
    await gestureRecognizer.setOptions({ runningMode: "IMAGE" });
  }
  
  // Remove all previous landmarks
  const allCanvas = event.target.parentNode.getElementsByClassName("canvas");
  for (var i = allCanvas.length - 1; i >= 0; i--) {
    const n = allCanvas[i];
    n.parentNode.removeChild(n);
  }

  const results = gestureRecognizer.recognize(event.target);
  // View results in the console to see their format
  console.log(results);

  if (results.gestures.length > 0) {
    const categoryName = results.gestures[0][0].categoryName;
    const categoryScore = (results.gestures[0][0].score * 100).toFixed(2);
    const handedness = results.handedness[0][0].displayName;

    demo1Data.value
      .find(item => item.id === id).result = `GestureRecognizer: ${categoryName}\n Confidence: ${categoryScore}%\n Handedness: ${handedness}`;
  
    const canvas = document.createElement("canvas");
    canvas.setAttribute("class", "canvas");
    canvas.setAttribute("width", event.target.naturalWidth + "px");
    canvas.setAttribute("height", event.target.naturalHeight + "px");
    canvas.style =
      "position: absolute;" +
      "left: 0px;" +
      "top: 0px;" +
      "width: " +
      event.target.width +
      "px;" +
      "height: " +
      event.target.height +
      "px;";

    event.target.parentNode.appendChild(canvas);
    const canvasCtx = canvas.getContext("2d");
    const drawingUtils = new DrawingUtils(canvasCtx);
    for (const landmarks of results.landmarks) {
      drawingUtils.drawConnectors(
        landmarks,
        GestureRecognizer.HAND_CONNECTIONS,
        {
          color: "#00FF00",
          lineWidth: 5
        }
      );
      drawingUtils.drawLandmarks(landmarks, {
        color: "#FF0000",
        lineWidth: 1
      });
    }
  }
}

/********************************************************************
// Demo 2: Continuously grab image from webcam stream and detect it.
********************************************************************/

const webcamRunning = ref(false);
const videoHeight = "360px";
const videoWidth = "480px";
const webcam = ref(null);
const canvasElement = ref(null);
const gestureOutputText = ref("");
let canvasCtx;
let stream = null;

onMounted(() => {
  canvasCtx = canvasElement.value.getContext("2d");
});

async function enableCam(event) {
  if (!gestureRecognizer) {
    alert("Please wait for gestureRecognizer to load");
    return;
  }

  webcamRunning.value = !webcamRunning.value;

  if (webcamRunning.value) {
    try {
      stream = await navigator.mediaDevices.getUserMedia({ video: true });
      webcam.value.srcObject = stream;
      webcam.value.addEventListener("loadeddata", predictWebcam);
    } catch (err) {
      console.error("Error accessing webcam:", err);
      webcamRunning.value = false;
    }
  } else {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      webcam.value.srcObject = null;
    }
  }
}

let lastVideoTime = -1;
let results = undefined;

async function predictWebcam() {
  if (!webcamRunning.value) return;

  if (runningMode === "IMAGE") {
    runningMode = "VIDEO";
    await gestureRecognizer.setOptions({ runningMode: "VIDEO" });
  }

  let nowInMs = Date.now();
  if (webcam.value.currentTime !== lastVideoTime) {
    lastVideoTime = webcam.value.currentTime;
    results = gestureRecognizer.recognizeForVideo(webcam.value, nowInMs);
  }

  canvasCtx.save();
  canvasCtx.clearRect(0, 0, canvasElement.value.width, canvasElement.value.height);
  canvasCtx.drawImage(webcam.value, 0, 0, canvasElement.value.width, canvasElement.value.height);

  const drawingUtils = new DrawingUtils(canvasCtx);

  canvasElement.value.style.height = videoHeight;
  webcam.value.style.height = videoHeight;
  canvasElement.value.style.width = videoWidth;
  webcam.value.style.width = videoWidth;

  if (results?.landmarks) {
    for (const landmarks of results.landmarks) {
      drawingUtils.drawConnectors(landmarks, GestureRecognizer.HAND_CONNECTIONS, {
        color: "#00FF00",
        lineWidth: 5,
      });
      drawingUtils.drawLandmarks(landmarks, {
        color: "#FF0000",
        lineWidth: 2,
      });
    }
  }
  canvasCtx.restore();

  if (results?.gestures?.length > 0) {
    const categoryName = results.gestures[0][0].categoryName;
    const categoryScore = parseFloat(results.gestures[0][0].score * 100).toFixed(2);
    const handedness = results.handedness[0][0].displayName;
    gestureOutputText.value = `GestureRecognizer: ${categoryName}\n Confidence: ${categoryScore} %\n Handedness: ${handedness}`;
  } else {
    gestureOutputText.value = "";
  }

  if (webcamRunning.value) {
    window.requestAnimationFrame(predictWebcam);
  }
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

.videoView {
  position: absolute;
  width: 48%;
  margin: 2% 1%;
  cursor: pointer;
  min-height: 500px;
}

.videoView p,
.detectOnClick p {
  padding-top: 5px;
  padding-bottom: 5px;
  background-color: #007f8b;
  color: #fff;
  border: 1px dashed rgba(255, 255, 255, 0.7);
  z-index: 2;
  margin: 0;
}

.detectOnClick .canvas {
  position: absolute;
  left: 0;
  top: 0;
  z-index: 1;
  pointer-events: none;
}

.output_canvas {
  transform: rotateY(180deg);
}

.detectOnClick {
  z-index: 0;
  font-size: calc(8px + 1.2vw);
}

.detectOnClick img {
  width: 45vw;
}

.output {
  width: 100%;
  font-size: calc(8px + 1.2vw);
}
</style>