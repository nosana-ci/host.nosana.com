<template>
  <div class="maintenance">
    <div class="maintenance__content">
      <Logo class="maintenance__logo light-only" width="180px" :animated="true" />
      <Logo
        class="maintenance__logo dark-only"
        width="180px"
        :white="true"
        :animated="true"
      />
      <h1 class="maintenance__title">Under maintenance</h1>
      <p class="maintenance__text">
        We're performing scheduled maintenance. Please check back shortly.
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import Logo from "~/components/UI/Logo.vue";

const SKIP_MAINTENANCE_KEY = "skipMaintenance";

definePageMeta({
  layout: "empty",
});

onMounted(() => {
  if (
    typeof localStorage !== "undefined" &&
    localStorage.getItem(SKIP_MAINTENANCE_KEY)
  ) {
    navigateTo("/", { replace: true });
  }
});
</script>

<style lang="scss" scoped>
.maintenance {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: $body-background-color;
}

html.dark-mode .maintenance {
  background: $body-background-color-dark;
}

.maintenance__content {
  text-align: center;
  padding: 2rem;
}

.maintenance__logo {
  margin-bottom: 2rem;
}

.maintenance__title {
  font-family: $title-family;
  font-size: 3rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
  color: $text;
}

html.dark-mode .maintenance__title {
  color: $white;
}

.maintenance__text {
  color: $text-light;
}

html.dark-mode .maintenance__text {
  color: $grey-light;
}
</style>
