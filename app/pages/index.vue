<template>
  <div>
    <LayoutTopBar
      :title="'Host your GPU on the Nosana Network'"
      :subtitle="'Connect your NVIDIA GPU to a decentralized AI inference marketplace and earn $NOS by running workloads for clients.'"
    />

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
            <NuxtLink
              to="https://docs.nosana.com/hosts/grid.html"
              class="is-size-7 has-text-link"
              external
              target="_blank"
            >
              View full hardware requirements
            </NuxtLink>
          </div>
        </div>

        <div class="column is-12-tablet is-6-desktop">
          <div class="box equal-height-box">
            <h3 class="title is-5 mb-3">Setup overview</h3>
            <ol class="steps-list">
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
            </ol>
            <div class="links-grid">
              <NuxtLink
                to="https://docs.nosana.com/hosts/grid-ubuntu.html"
                class="is-size-7 has-text-link"
                external
                target="_blank"
              >
                Ubuntu setup guide
              </NuxtLink>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Existing host teaser -->
    <section class="second-section">
      <div class="box">
        <h2 class="title is-4 mb-3">Already running a host?</h2>
        <form class="field mb-4" @submit.prevent="onSearchSubmit">
          <div class="control">
            <input
              v-model="searchAddress"
              class="input"
              type="text"
              placeholder="Enter your host address and press Enter"
            />
          </div>
        </form>
        <button class="button is-primary" @click="onExistingHostClick">
          Already a host? Log in
        </button>
      </div>
    </section>

  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore types are provided at project level for this library
import { useWallet } from "solana-wallets-vue";
import { useLoginModal } from "~/composables/useLoginModal";
import LayoutTopBar from "~/components/Layout/TopBar.vue";

const router = useRouter();
const { connected, publicKey } = useWallet();
const { openWalletModal } = useLoginModal();

const searchAddress = ref("");

const onExistingHostClick = () => {
  if (connected.value && publicKey.value) {
    router.push(`/${publicKey.value.toString()}`);
    return;
  }
  openWalletModal("/");
};

const onSearchSubmit = () => {
  const trimmed = searchAddress.value.trim();
  if (!trimmed) return;
  router.push(`/${trimmed}`);
};
</script>

<style scoped lang="scss">
.hero-section {
  padding: 2rem 0 1rem;
}

.hero-content {
  max-width: 720px;
}

.requirements-list,
.steps-list {
  margin-left: 1rem;
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
  margin-top: 0.75rem;
}

.equal-height-box {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.first-section {
  margin-top: 2rem;
}

.second-section {
  margin-top: 2rem;
}
</style>

