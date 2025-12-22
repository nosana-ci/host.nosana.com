<template>
  <footer
    class="footer has-text-centered has-background-white has-border-top-grey py-5"
  >
    <div
      class="is-size-6 is-flex is-justify-content-center mb-3 mt-1"
      style="gap: 10px"
    >
      <a href="https://deploy.nosana.com/" target="_blank" class="has-text-grey">Deploy</a>
      <span class="has-text-grey">|</span>
      <a href="https://explore.nosana.com/" target="_blank" class="has-text-grey">Explore</a>
      <span class="has-text-grey">|</span>
      <a href="https://host.nosana.com/" target="_blank" class="has-text-grey">Host</a>
    </div>
    <div class="is-size-6 mb-1">
      &copy; {{ new Date().getFullYear() }}
      <b>Nosana</b>
    </div>
  </footer>
</template>
