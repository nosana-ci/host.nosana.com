<template>
  <div class="landing-page-container">
    <!-- Background World Map -->
    <div class="map-background">
      <WorldMap />
    </div>

    <!-- Content Overlay -->
    <div class="content-overlay">
      <LayoutTopBar
        :title="'Host'"/>

      <!-- Getting Started -->
      <section class="first-section">
      <div class="columns is-multiline">
        <div class="column is-12-tablet is-6-desktop">
          <div class="box equal-height-box">
            <h3 class="title is-5 mb-3">Hardware requirements</h3>
            <ul class="requirements-list">
              <li><strong>RAM</strong>: 12GB or more</li>
              <li><strong>Storage</strong>: 256GB+ NVMe SSD (1TB recommended for large models)</li>
              <li><strong>Bandwidth</strong>: 100 Mbps down / 50 Mbps up (500/250 Mbps recommended)</li>
              <li><strong>GPU</strong>: Recent NVIDIA RTX / A-series (see full list)</li>
              <li><strong>OS</strong>: Ubuntu 20.04+ (native, Windows / WSL2 deprecated)</li>
            </ul>
            <div class="links-grid">
              <NuxtLink
                to="https://docs.nosana.com/hosts/grid.html"
                class="is-size-6 has-text-link"
                external
                target="_blank"
              >
                Full hardware requirements
              </NuxtLink>
            </div>
          </div>
        </div>

        <div class="column is-12-tablet is-6-desktop">
          <div class="box equal-height-box setup-overview-box">
            <h3 class="title is-5 mb-3">Setup overview</h3>
            <ul class="steps-list">
              <li>
                Install Docker and configure it for non-root usage.
              </li>
              <li>
                Install NVIDIA drivers and the NVIDIA Container Toolkit.
              </li>
              <li>
                Run the Nosana start script:
                <pre><code>bash &lt;(wget -qO- https://nosana.com/start.sh)</code></pre>
              </li>
              <li>
                Register your node and <strong>back up</strong> <code>~/.nosana/nosana_key.json</code>.
              </li>
            </ul>
            <div class="links-grid">
              <NuxtLink
                to="https://docs.nosana.com/hosts/grid-ubuntu.html"
                class="is-size-6 has-text-link"
                external
                target="_blank"
              >
                Setup guide
              </NuxtLink>
            </div>
            <div class="login-button-container">
              <button class="button is-primary" @click="onExistingHostClick">
                Already a host? Log in
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
    </div>
  </div>
</template>

<script setup lang="ts">
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore types are provided at project level for this library
import { useWallet } from "solana-wallets-vue";
import { useLoginModal } from "~/composables/useLoginModal";
import LayoutTopBar from "~/components/Layout/TopBar.vue";
import WorldMap from "~/components/WorldMap.vue";

const router = useRouter();
const { connected, publicKey } = useWallet();
const { openWalletModal } = useLoginModal();

const onExistingHostClick = () => {
  if (connected.value && publicKey.value) {
    router.push(`/${publicKey.value.toString()}`);
    return;
  }
  openWalletModal({ redirectToHost: true });
};
</script>

<style scoped lang="scss">
.landing-page-container {
  position: relative;
  min-height: 100vh;
  overflow: hidden;
}

.map-background {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100vh;
  z-index: 0;
  opacity: 0.7;
  
  :deep(.box) {
    height: 100%;
    background: transparent !important;
  }
  
  :deep(.world-map-container) {
    height: 100%;
  }
}

.content-overlay {
  position: relative;
  z-index: 1;
  pointer-events: none;
  
  // Make all interactive elements clickable
  > * {
    pointer-events: auto;
  }
  
  // Ensure nested interactive elements work
  :deep(a),
  :deep(button),
  :deep(input),
  :deep(form),
  :deep(.box),
  :deep(.button),
  :deep(.input),
  :deep(.field),
  :deep(.control) {
    pointer-events: auto;
  }
}

.hero-section {
  padding: 2rem 0 1rem;
}

.hero-content {
  max-width: 720px;
}

.requirements-list,
.steps-list {
  margin-left: 0;
}

.requirements-list li,
.steps-list li {
  margin-bottom: 0.35rem;
}

pre {
  background: rgba(10, 10, 10, 0.05);
  padding: 0.5rem 0.75rem;
  border-radius: 4px;
  font-size: 0.8rem;
  overflow-x: auto;
}

.links-grid {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  margin-top: auto;
}

.equal-height-box {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.setup-overview-box {
  position: relative;
}

.login-button-container {
  position: absolute;
  bottom: 1rem;
  right: 1rem;
  margin-top: auto;
}

.first-section {
  margin-top: 2rem;
}
</style>

