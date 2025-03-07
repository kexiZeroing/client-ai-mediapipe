<template>
  <nav>
    <router-link
      v-for="router in routers"
      :key="router.path"
      :to="router.path"
    >
      <button :class="{ 'active-route': $route.path === router.path }">
        {{ router.name }}
      </button>
    </router-link>
  </nav>

  <router-view></router-view>
</template>

<script setup lang="ts">
const routers = [
  { path: '/', name: 'Home' },
  { path: '/gesture-recognition', name: 'Hand Gesture Recognition' },
  { path: '/object-detection', name: 'Object Detection' },
  { path: '/face-landmark-detection', name: 'Face Landmark Detection' },
]
</script>

<style scoped>
nav {
  padding: 1rem;
}

nav button {
  margin: 0 0.5rem;
  padding: 0.5rem 1rem;
  cursor: pointer;
  background-color: #f0f0f0;
  border: 1px solid #ddd;
  outline: none;
}

nav button.active-route {
  background-color: #42b983;
  color: white;
  border: none;
  font-weight: bold;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}
</style>
