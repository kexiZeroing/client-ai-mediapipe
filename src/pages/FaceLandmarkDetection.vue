<template>
  <section id="demos" :class="{ invisible: isInvisible }">
    <h2>Demo: Webcam continuous face landmarks detection</h2>

    <div id="liveView" class="videoView">
      <button @click="toggleWebcam">
        {{ buttonText }}
      </button>
      <div style="position: relative;">
        <video ref="webcam" autoplay playsinline></video>
        <canvas ref="outputCanvas" class="output_canvas" style="position: absolute; left: 0px; top: 0px;"></canvas>
      </div>
    </div>
    <div class="blend-shapes">
      <ul class="blend-shapes-list">
        <li v-for="shape in currentBlendShapes" :key="shape.categoryName" class="blend-shapes-item">
          <span class="blend-shapes-label">{{ shape.displayName || shape.categoryName }}</span>
          <span class="blend-shapes-value" :style="{ width: `calc(${shape.score * 100}% - 120px)` }">{{ shape.score.toFixed(4) }}</span>
        </li>
      </ul>
    </div>
  </section>
</template>

<script>
import { FaceLandmarker, FilesetResolver, DrawingUtils } from "@mediapipe/tasks-vision";

export default {
  name: 'FaceLandmarkDetection',
  data() {
    return {
      runningMode: 'IMAGE',
      webcamRunning: false,
      videoWidth: 480,
      lastVideoTime: -1,
      results: undefined,
      isModelLoaded: false,
      isInvisible: true,
      currentBlendShapes: []
    };
  },
  created() {
    this.createFaceLandmarker();
  },
  mounted() {
    this.canvasCtx = this.$refs.outputCanvas.getContext('2d');
    this.drawingUtils = new DrawingUtils(this.canvasCtx);
  },
  methods: {
    async createFaceLandmarker() {
      const filesetResolver = await FilesetResolver.forVisionTasks('/wasm');
      this.faceLandmarker = await FaceLandmarker.createFromOptions(filesetResolver, {
        baseOptions: {
          modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task',
          delegate: 'GPU'
        },
        outputFaceBlendshapes: true,
        runningMode: this.runningMode,
        numFaces: 1
      });
      this.isModelLoaded = true;
      this.isInvisible = false;
    },
    toggleWebcam() {
      if (!this.isModelLoaded) {
        console.log('Wait! faceLandmarker not loaded yet.');
        return;
      }
      this.webcamRunning = !this.webcamRunning;
      if (this.webcamRunning) {
        const constraints = { video: true };
        navigator.mediaDevices.getUserMedia(constraints).then((stream) => {
          this.$refs.webcam.srcObject = stream;
          this.$refs.webcam.addEventListener('loadeddata', () => this.predictWebcam());
        });
      } else {
        this.$refs.webcam.srcObject.getTracks().forEach((track) => track.stop());
        this.$refs.webcam.srcObject = null;
      }
    },
    async predictWebcam() {
      const video = this.$refs.webcam;
      const canvasElement = this.$refs.outputCanvas;
      const radio = video.videoHeight / video.videoWidth;
      video.style.width = `${this.videoWidth}px`;
      video.style.height = `${this.videoWidth * radio}px`;
      canvasElement.style.width = `${this.videoWidth}px`;
      canvasElement.style.height = `${this.videoWidth * radio}px`;
      canvasElement.width = video.videoWidth;
      canvasElement.height = video.videoHeight;

      if (this.runningMode === 'IMAGE') {
        this.runningMode = 'VIDEO';
        await this.faceLandmarker.setOptions({ runningMode: this.runningMode });
      }

      const startTimeMs = performance.now();
      if (this.lastVideoTime !== video.currentTime) {
        this.lastVideoTime = video.currentTime;
        this.results = this.faceLandmarker.detectForVideo(video, startTimeMs);
      }

      if (this.results?.faceLandmarks) {
        for (const landmarks of this.results.faceLandmarks) {
          this.drawingUtils.drawConnectors(
            landmarks,
            FaceLandmarker.FACE_LANDMARKS_TESSELATION,
            { color: '#C0C0C070', lineWidth: 1 }
          );
          this.drawingUtils.drawConnectors(
            landmarks,
            FaceLandmarker.FACE_LANDMARKS_RIGHT_EYE,
            { color: '#FF3030' }
          );
          this.drawingUtils.drawConnectors(
            landmarks,
            FaceLandmarker.FACE_LANDMARKS_RIGHT_EYEBROW,
            { color: '#FF3030' }
          );
          this.drawingUtils.drawConnectors(
            landmarks,
            FaceLandmarker.FACE_LANDMARKS_LEFT_EYE,
            { color: '#30FF30' }
          );
          this.drawingUtils.drawConnectors(
            landmarks,
            FaceLandmarker.FACE_LANDMARKS_LEFT_EYEBROW,
            { color: '#30FF30' }
          );
          this.drawingUtils.drawConnectors(
            landmarks,
            FaceLandmarker.FACE_LANDMARKS_FACE_OVAL,
            { color: '#E0E0E0' }
          );
          this.drawingUtils.drawConnectors(
            landmarks,
            FaceLandmarker.FACE_LANDMARKS_LIPS,
            { color: '#E0E0E0' }
          );
          this.drawingUtils.drawConnectors(
            landmarks,
            FaceLandmarker.FACE_LANDMARKS_RIGHT_IRIS,
            { color: '#FF3030' }
          );
          this.drawingUtils.drawConnectors(
            landmarks,
            FaceLandmarker.FACE_LANDMARKS_LEFT_IRIS,
            { color: '#30FF30' }
          );
        }
      }

      this.currentBlendShapes = this.results?.faceBlendshapes?.length > 0
        ? this.results.faceBlendshapes[0].categories
        : [];

      if (this.webcamRunning) {
        window.requestAnimationFrame(() => this.predictWebcam());
      }
    }
  },
  computed: {
    buttonText() {
      return this.webcamRunning ? 'DISABLE PREDICTIONS' : 'ENABLE PREDICTIONS';
    }
  }
};
</script>

<style scoped>
video {
  clear: both;
  display: block;
  transform: rotateY(180deg);
  -webkit-transform: rotateY(180deg);
  -moz-transform: rotateY(180deg);
}

section {
  opacity: 1;
  transition: opacity 500ms ease-in-out;
}

.invisible {
  opacity: 0.2;
}

.videoView,
.blend-shapes {
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

.canvas {
  z-index: 1;
  position: absolute;
  pointer-events: none;
}

.output_canvas {
  transform: rotateY(180deg);
  -webkit-transform: rotateY(180deg);
  -moz-transform: rotateY(180deg);
}

.blend-shapes-item {
  display: flex;
  align-items: center;
  height: 20px;
}

.blend-shapes-label {
  display: flex;
  width: 120px;
  justify-content: flex-end;
  align-items: center;
  margin-right: 4px;
}

.blend-shapes-value {
  display: flex;
  height: 16px;
  align-items: center;
  background-color: #007f8b;
}
</style>