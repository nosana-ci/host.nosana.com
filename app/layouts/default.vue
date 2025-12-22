<template>
  <div id="app">
    <section class="columns ml-0 mr-0 mt-0 mb-0">
      <div
        id="content"
        class="column ultrawide-centered"
      >
        <div class="section">
          <div>
            <slot />
          </div>
        </div>        
      </div>
    </section>
    <SiteFooter class="mt-auto" />

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
  min-height: calc(100vh - 100px);
  max-width: 1600px;
  min-width: 0;
}

.ultrawide-centered {
  margin-left: auto;
  margin-right: auto;
  padding-left: 2rem;
  padding-right: 2rem;
  @media screen and (max-width: $tablet) {
    padding-left: 0;
    padding-right: 0;
  }
}
</style>
