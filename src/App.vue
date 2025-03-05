<template>
  <nav>
    <router-link to="/" custom v-slot="{ navigate, isActive }">
      <button @click="navigate" :class="{ 'active-route': isActive }">
        Home
      </button>
    </router-link>
    <router-link to="/gesture-recognition" custom v-slot="{ navigate, isActive }">
      <button @click="navigate" :class="{ 'active-route': isActive }">
        Hand Gesture Recognition
      </button>
    </router-link>
    <router-link to="/object-detection" custom v-slot="{ navigate, isActive }">
      <button @click="navigate" :class="{ 'active-route': isActive }">
        Object Detection
      </button>
    </router-link>
  </nav>

  <router-view></router-view>
</template>

<script setup lang="ts">
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
