<template>
  <div>
    <NuxtLayout>
      <NuxtPwaManifest />
      <NuxtPage />
    </NuxtLayout>
  </div>
</template>

<script setup lang="ts">
useSeoMeta({
  title: 'Nosana Host',
  ogTitle: 'Nosana Host',
  twitterTitle: 'Nosana Host',
  description: 'Track your Nosana host\'s performance and earnings',
  ogDescription: 'Track your Nosana host\'s performance and earnings',
  twitterDescription: 'Track your Nosana host\'s performance and earnings',
  ogImage: 'https://host.nosana.com/img/screenshot.png',
  twitterImage: 'https://host.nosana.com/img/screenshot.png',
  twitterCard: 'summary_large_image'
})

useHead({
  htmlAttrs: {
    lang: 'en'
  },
  link: [
    {
      rel: 'icon',
      type: 'image/ico',
      href: '/favicon.ico',
      sizes: 'any'
    }
  ]
})

</script>