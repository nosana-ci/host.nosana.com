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
      <SiteFooter class="mt-auto" />
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
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore types are provided at project level for this library
import { useWallet } from "solana-wallets-vue";
import LoginModal from "~/components/Auth/LoginModal.vue";
import SiteFooter from "~/components/Layout/SiteFooter.vue";

// Initialize redirect to handle navigation on connect/disconnect
useRedirect();

// Initialize login modal
const { modalState, closeModal } = useLoginModal();
const router = useRouter();
const { publicKey } = useWallet();

// Handle successful login
const handleLoginSuccess = () => {
  // If login was initiated from a host login action, go directly to the host page
  if (modalState.value.redirectToHost && publicKey.value) {
    router.push(`/${publicKey.value.toString()}`);
    return;
  }

  // Otherwise, redirect to the specified path if provided
  if (modalState.value.redirectPath) {
    router.push(modalState.value.redirectPath);
  }
  // If no redirect path specified, stay on the current page
};

</script>

<style lang="scss" scoped>
#content {
  min-height: 100vh;
  min-width: 0;
}
</style>
