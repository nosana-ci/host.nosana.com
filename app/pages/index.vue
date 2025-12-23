<template>
  <div class="landing-page-container">
    <LayoutTopBar :title="'Host'"/>

    <section class="section hero mt-6">
      <div class="hero-body has-text-centered mt-5">
        <h1 class="title is-1 mb-5 mt-6">Track your Nosana host's performance and earnings</h1>
        <p class="subtitle is-4 mb-6">
          Monitor your GPU performance and view real-time statistics
        </p>

        <div class="actions-container mt-5">
          <button class="button is-primary is-large login-button mb-4" @click="onLoginClick">
            <span>Login</span>
          </button>
          
          <a
            href="https://docs.nosana.io/hosts/grid.html"
            target="_blank"
            class="setup-link is-size-5"
          >
            Not a host yet? Setup a Host
          </a>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore types are provided at project level for this library
import { useWallet } from "solana-wallets-vue";
import { useLoginModal } from "~/composables/useLoginModal";
import LayoutTopBar from "~/components/Layout/TopBar.vue";

const router = useRouter();
const { connected, publicKey } = useWallet();
const { openWalletModal } = useLoginModal();

const onLoginClick = () => {
  if (connected.value && publicKey.value) {
    router.push(`/${publicKey.value.toString()}`);
    return;
  }
  openWalletModal({ redirectToHost: true });
};
</script>

<style scoped lang="scss">
@use "~/assets/styles/variables" as *;

.landing-page-container {
  min-height: calc(100vh - 100px);
  display: flex;
  flex-direction: column;
  position: relative;
  overflow: hidden;
  margin-left: calc(-1 * var(--bulma-section-padding-medium, 1.5rem));
  margin-right: calc(-1 * var(--bulma-section-padding-medium, 1.5rem));
}

.actions-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  max-width: 400px;
  margin: 0 auto;
}

.login-button {
  font-weight: 700;
  transition: all 0.2s ease;
  height: auto;
  max-width: 300px;
  width: 100%;
  padding: 1.2rem;
  border-radius: 8px;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 0 20px rgba($primary, 0.01);
    filter: brightness(1.1);
  }
}

.setup-link {
  text-decoration: none;
  transition: color 0.2s ease;
  position: relative;
  color: $grey;
  
  &::after {
    content: '';
    position: absolute;
    width: 100%;
    height: 1px;
    bottom: -2px;
    left: 0;
    background-color: currentColor;
    transform: scaleX(0);
    transform-origin: center;
    transition: transform 0.2s ease;
  }

  &:hover {
    color: $secondary !important;
    
    &::after {
      transform: scaleX(1);
    }
  }
}
</style>

