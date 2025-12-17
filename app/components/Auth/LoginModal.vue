<template>
  <div v-if="isOpen" class="login-modal-overlay" @click="closeModal">
    <div class="login-modal" @click.stop>
      <!-- Header with Logo -->
      <div class="login-header">
        <Logo width="120px" :animated="true" class="light-only" />
        <Logo width="120px" :white="true" class="dark-only" :animated="true" />
      </div>

      <!-- Main Login Content -->
      <div class="login-content">
        <h1 class="login-title">Connect Your Wallet</h1>
        <p class="login-subtitle">Connect your wallet to view host earnings and manage your nodes</p>

        <!-- Wallet Connection Button -->
        <div class="wallet-section">
          <button 
            class="login-button wallet-button" 
            @click="handleWalletConnect"
            :disabled="connected"
          >
            <WalletIcon :size="20" />
            {{ connected ? 'Wallet Connected' : 'Select Wallet' }}
          </button>
        </div>

        <!-- Wallet Selection Modal -->
        <div v-if="showWalletModal" class="wallet-selection-modal" @click="showWalletModal = false">
          <div class="wallet-modal-content" @click.stop>
            <h3 class="wallet-modal-title">Select a Wallet</h3>
            <div class="wallet-list">
              <div 
                v-for="wallet in wallets" 
                :key="wallet.adapter.name"
                class="wallet-item"
                @click="selectWallet(wallet.adapter.name)"
              >
                <img 
                  :src="wallet.adapter.icon" 
                  :alt="wallet.adapter.name"
                  class="wallet-icon"
                />
                <span class="wallet-name">{{ wallet.adapter.name }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Close button -->
      <button class="modal-close-button" @click="closeModal">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M6 6L18 18M6 18L18 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { useWallet } from 'solana-wallets-vue';
import { useRouter } from 'vue-router';
import { useToast } from 'vue-toastification';
import WalletIcon from '~/components/UI/WalletIcon.vue';
import Logo from '~/components/UI/Logo.vue';

interface LoginModalProps {
  isOpen: boolean;
  mode?: 'wallet';
  redirectPath?: string;
}

const props = withDefaults(defineProps<LoginModalProps>(), {
  mode: 'wallet',
  redirectPath: undefined
});

const emit = defineEmits<{
  close: [];
  success: [];
}>();

const { connected, disconnect, select, connect, wallets, publicKey, wallet, readyState } = useWallet();
const router = useRouter();
const toast = useToast();

const showWalletModal = ref(false);

const closeModal = () => {
  emit('close');
};

// Wallet connection logic
const handleWalletConnect = async () => {
  try {
    if (wallets.value && wallets.value.length > 0) {
      showWalletModal.value = true;
    } else {
      toast.error("No wallets found");
    }
  } catch (error) {
    console.error("Error preparing wallet selection:", error);
    toast.error("Failed to prepare wallet connection.");
  }
};

// Select specific wallet
const selectWallet = async (walletName: string) => {
  showWalletModal.value = false;
  
  try {
    await select(walletName as any);
    await connect();
  } catch (error) {
    console.error("Error selecting wallet:", error);
    toast.error(`Failed to connect to ${walletName}. Please try again.`);
  }
};

// Watch for wallet connection success
watch(connected, (isConnected) => {
  if (isConnected) {
    // Close modal and emit success
    emit('success');
    emit('close');
  }
});
</script>

<style lang="scss" scoped>

/* ==========================================================================
   Login Modal Overlay
   ========================================================================== */

.login-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

/* ==========================================================================
   Login Modal - Light Mode (Default)
   ========================================================================== */

.login-modal {
  background: $white;
  color: $black;
  border-radius: 16px;
  padding: 3rem;
  max-width: 500px;
  width: 90%;
  max-height: 90vh;
  overflow-y: auto;
  font-family: 'Outfit', sans-serif;
  text-align: center;
  position: relative;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
}

.login-header {
  margin-bottom: 2rem;
}

.login-content {
  margin-bottom: 2rem;
}

.login-title {
  font-size: 2rem;
  font-weight: 600;
  margin-bottom: 1rem;
  color: $black;
}

.login-subtitle {
  font-size: 1rem;
  color: $grey;
  margin-bottom: 2rem;
  line-height: 1.5;
}

.login-button {
  width: 100%;
  padding: 0.875rem 1.5rem;
  border: 1px solid $grey-light;
  border-radius: 8px;
  background: $white-bis;
  color: $black;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  margin-bottom: 1rem;
  position: relative;

  &:hover:not(:disabled) {
    background: $white-ter;
    border-color: $grey;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}

.google-button {
  background: $white;
  border-color: $grey-light;
  
  &:hover:not(:disabled) {
    background: $white-bis;
    border-color: $grey;
  }
}

.twitter-button {
  background: $black;
  color: $white;
  border-color: $grey-dark;
  
  &:hover:not(:disabled) {
    background: $grey-darker;
    border-color: $grey;
  }
}

.divider {
  margin: 1.5rem 0;
  text-align: center;
  
  span {
    color: $grey;
    font-size: 0.875rem;
  }
}

.wallet-section {
  margin-bottom: 0;
}

/* Loading state styles */
.login-button.is-loading {
  color: transparent !important;
  pointer-events: none;

  &::after {
    content: '';
    position: absolute;
    width: 1.25rem;
    height: 1.25rem;
    border: 2px solid;
    border-color: $black transparent $black transparent;
    border-radius: 50%;
    animation: button-loading-spinner 1.2s linear infinite;
  }
}

.twitter-button.is-loading::after {
  border-color: $white transparent $white transparent !important;
}

@keyframes button-loading-spinner {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

/* Dark mode styles moved to global.scss following Bulma styling flowchart */

.modal-close-button {
  position: absolute;
  top: 1rem;
  right: 1rem;
  background: none;
  border: none;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 8px;
  transition: background-color 0.2s;
  color: $grey;
}

.modal-close-button:hover {
  background-color: $white-ter;
  color: $black;
}

/* Wallet Selection Modal */
.wallet-selection-modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1001;
}

.wallet-modal-content {
  background: $white;
  color: $black;
  border-radius: 12px;
  padding: 2rem;
  max-width: 400px;
  width: 90%;
  margin: 0 auto;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
}

.wallet-modal-title {
  font-size: 1.5rem;
  font-weight: 600;
  color: $black;
  text-align: center;
  margin-bottom: 1.5rem;
}

.wallet-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.wallet-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  border: 1px solid $grey-light;
  border-radius: 8px;
  background: $white-bis;
  color: $black;
  cursor: pointer;
  transition: all 0.2s ease;
}

.wallet-item:hover {
  border-color: $secondary;
  background: $white-ter;
}

.wallet-icon {
  width: 32px;
  height: 32px;
  border-radius: 4px;
}

.wallet-name {
  font-size: 1rem;
  font-weight: 500;
  color: $black;
}

/* All overrides removed - clean implementation using Bulma variables */

@media (max-width: 640px) {
  .login-modal {
    padding: 2rem;
  }
  
  .login-title {
    font-size: 1.75rem;
  }
}
</style>