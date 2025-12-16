<template>
  <div id="app">
    <div
      id="content"
      class="is-flex is-flex-direction-column"
      style="min-height: 100vh; max-width: 1400px; margin: 0 auto; padding: 2rem;"
    >
      <div class="section">
        <div>
          <slot />
        </div>
      </div>
      <site-footer class="mt-auto" />
    </div>

    <!-- Login Modal -->
    <LoginModal
      :isOpen="modalState.isOpen"
      :mode="modalState.mode"
      :redirectPath="modalState.redirectPath"
      @close="closeModal"
      @success="handleLoginSuccess"
    />
  </div>
</template>

<script setup lang="ts">
import { useRedirect } from "~/composables/useRedirect";
import { useLoginModal } from "~/composables/useLoginModal";
import { useRouter, useRoute } from "vue-router";
import LoginModal from "~/components/Auth/LoginModal.vue";

// Initialize redirect to handle navigation on connect/disconnect
useRedirect();

// Initialize login modal
const { modalState, closeModal } = useLoginModal();
const router = useRouter();

// Handle successful login
const handleLoginSuccess = () => {
  // Always redirect to the specified path if provided, otherwise stay on current page
  if (modalState.value.redirectPath) {
    router.push(modalState.value.redirectPath);
  }
  // If no redirect path specified, stay on the current page (do nothing)
};

</script>

<style lang="scss" scoped>
#content {
  min-height: 100vh;
  min-width: 0;
}
</style>
