<template>
  <div>
    <ul>
      <li v-for="(link, index) in links" :key="index">
        <a :href="link" target="_blank">
          {{ link }}
        </a>
      </li>
    </ul>
  </div>
</template>

<script setup>
const links = [
  'https://mediapipe-studio.webapps.google.com/home',
  'https://ai.google.dev/edge/mediapipe/solutions/guide',
]
</script>

<style scoped>
ul {
  list-style-type: none;
  padding: 0;
}

a {
  color: #1a73e8;
  text-decoration: none;
  
  &:hover {
    text-decoration: underline;
  }
}
</style>