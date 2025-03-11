# Client AI using MediaPipe

Exploring and experimenting with the example demos provided in [MediaPipe Studio](https://mediapipe-studio.webapps.google.com/home) to understand its usage.

- https://ai.google.dev/edge/mediapipe/solutions/guide
- https://www.youtube.com/playlist?list=PLOU2XLYxmsILVnjfBvtTWZC4YiHBwz-4l

### MediaPipe Tasks Setup

```js
const createGestureRecognizer = async () => {
  const vision = await FilesetResolver.forVisionTasks(
    "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/wasm"
  );
  gestureRecognizer = await GestureRecognizer.createFromOptions(vision, {
    baseOptions: {
      modelAssetPath:
        "https://storage.googleapis.com/mediapipe-models/gesture_recognizer/gesture_recognizer/float16/1/gesture_recognizer.task",
      delegate: "GPU"
    },
    runningMode: runningMode
  });
```

1. WASM lets you run code compiled from faster languages like C++ or Rust directly in the browser, making it perfect for handling the heavy lifting of image processing and machine learning inference that MediaPipe performs. These are the core files that set up the MediaPipe environment for vision tasks.

2. `modelAssetPath` points to a specific file—a machine learning model designed for gesture recognition. The model is hosted on Google Cloud Storage and is part of the MediaPipe framework, which is commonly used for tasks like recognizing hand gestures from video or images. The path includes details like `"gesture_recognizer"` (the type of model), `"float16"` (indicating the model uses 16-bit floating-point numbers for its weights, which makes it smaller and faster), and `"gesture_recognizer.task"` (the actual model file).
