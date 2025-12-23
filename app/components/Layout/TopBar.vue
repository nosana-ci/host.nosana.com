<template>
  <div class="is-flex is-justify-content-space-between is-align-items-center mb-5 is-flex-wrap-wrap">
    <div class="is-flex is-flex-direction-row is-align-items-center">
      <nuxt-link to="/" class="navbar-logo">
        <Logo width="160px" :animated="true" class="light-only" />
        <Logo width="160px" :white="true" :animated="true" class="dark-only" />
      </nuxt-link>
      <div class="vertical-divider mx-4"></div>
      <h2 class="title is-3 mb-0">{{ title }}</h2>
      <div
        v-if="connected && wallet && !hideButtons"
        class="dropdown mobile-avatar-dropdown is-hidden-desktop ml-3"
        :class="{ 'is-active': showMobileDropdown }"
      >
        <div class="dropdown-trigger">
          <span class="mobile-avatar-trigger" @click="showMobileDropdown = !showMobileDropdown">
            <img
              v-if="wallet.adapter.icon"
              :src="wallet.adapter.icon"
              :alt="wallet.adapter.name + ' icon'"
              class="wallet-icon"
            />
            <span v-else>W</span>
          </span>
        </div>
        <div class="dropdown-menu">
          <div class="dropdown-content">
            <div class="dropdown-item">
              <p class="is-size-7 has-text-grey mb-0">{{ getWalletAddress() }}</p>
            </div>
            <hr class="dropdown-divider">
            <button class="dropdown-item logout-item" @click="logout">
              <LogoutIcon class="dropdown-icon" />
              Log out
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Right: Actions -->
    <div class="is-flex is-flex-direction-row is-align-items-center profile-section">
        <!-- Status Link -->
        <a 
          href="https://nosana.statuspage.io" 
          target="_blank" 
          rel="noopener noreferrer"
          class="navbar-tab is-hidden-mobile"
        >
          <div class="status-dot"></div>
          <span>Status</span>
        </a>
      <!-- Dark Mode Toggle -->
      <button 
        class="navbar-tab mr-4 is-hidden-mobile"
        @click="toggleDarkMode"
        :title="$colorMode.value === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'"
      >
        <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
          <path v-if="$colorMode.value === 'dark'" fill-rule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clip-rule="evenodd" fill="currentColor"/>
          <path v-else d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" fill="currentColor"/>
        </svg>
      </button>
      <div v-if="!connected && !hideButtons">
        <button 
          class="navbar-tab"
          @click="openLoginModal"
        >
          Connect wallet
        </button>
      </div>
      <div
        v-if="connected && !hideButtons"
        class="profile-dropdown"
        :class="{ 'sticky-profile': $route.path === '/deploy' }"
      >
        <div class="profile-button" @click="toggleUserProfileDropdown">
          <!-- Wallet User -->
          <template v-if="connected && wallet">
            <div class="profile-avatar wallet-avatar">
              <img v-if="wallet.adapter.icon" :src="wallet.adapter.icon" :alt="wallet.adapter.name + ' icon'" class="wallet-icon" />
              <span v-else>W</span>
            </div>
            <div class="profile-info">
              <span class="profile-name">{{ getWalletAddress() }}</span>
              <span class="profile-balance">${{ getNosBalanceUSD().toFixed(2) }}</span>
            </div>
          </template>
          <svg class="dropdown-arrow" :class="{ 'is-flipped': showUserProfileDropdown }" width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M7.5 3L4.5 6L7.5 9" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </div>

        <div v-if="showUserProfileDropdown" class="dropdown-menu-simple">
          <!-- Priority Fee Settings -->
          <button class="dropdown-item-simple" @click.stop="openPriorityFeeSettings">
            <SettingsIcon class="dropdown-icon" />
            Priority Fee Settings
          </button>
          <hr class="dropdown-divider">
          <button class="dropdown-item-simple logout-item" @click.stop="logout">
            <LogoutIcon class="dropdown-icon" />
            Log out
          </button>
        </div>
      </div>

      <!-- Mobile Menu Toggle -->
      <button 
        class="mobile-menu-toggle is-hidden-tablet"
        @click="showMobileMenu = !showMobileMenu"
        :class="{ 'is-active': showMobileMenu }"
      >
        <span></span>
        <span></span>
        <span></span>
      </button>
    </div>

    <!-- Mobile Menu -->
    <div class="mobile-menu is-hidden-tablet" :class="{ 'is-active': showMobileMenu }">
        <a 
          href="https://nosana.statuspage.io" 
          target="_blank" 
          rel="noopener noreferrer"
          class="mobile-menu-item"
          @click="showMobileMenu = false"
        >
          <div class="status-dot"></div>
          Status
        </a>
    </div>

    <!-- Settings Modal -->
    <div class="modal" :class="{ 'is-active': modelValue }">
      <div class="modal-background" @click="updateShowSettingsModal(false)"></div>
      <div class="modal-content">
        <div class="box">
          <h2 class="title mb-5 has-text-weight-bold">Settings</h2>
          <h3 class="title is-5">Global Priority Fee Level</h3>
          <p class="subtitle is-size-5">
            These fees apply across Nosana's entire product suite, such as
            staking actions, posting jobs etc.
          </p>
          <div class="field has-addons">
            <p class="control">
              <button class="button is-medium is-primary" @click="setPrioFeeConfig('low')"
                :class="{ 'is-outlined': prioFee.strategy !== 'low' }">
                <span>Slow</span>
              </button>
            </p>
            <p class="control">
              <button class="button is-medium is-primary" @click="setPrioFeeConfig('medium')"
                :class="{ 'is-outlined': prioFee.strategy !== 'medium' }">
                <span>Medium</span>
              </button>
            </p>
            <p class="control">
              <button class="button is-medium is-primary" @click="setPrioFeeConfig('high')"
                :class="{ 'is-outlined': prioFee.strategy !== 'high' }">
                <span>Fast</span>
              </button>
            </p>
            <p class="control">
              <button class="button is-medium is-primary" @click="setPrioFeeConfig('veryHigh')"
                :class="{ 'is-outlined': prioFee.strategy !== 'veryHigh' }">
                <span>Ultra</span>
              </button>
            </p>
          </div>
        </div>
      </div>
      <button class="modal-close is-large" @click="updateShowSettingsModal(false)" aria-label="close"></button>
    </div>
  </div>
</template>
<script lang="ts" setup>
import { computed, ref, onMounted, onUnmounted, watch } from 'vue';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore types are provided at project level for this library
import { WalletMultiButton, useWallet } from "solana-wallets-vue";
import SettingsIcon from '@/assets/img/icons/settings.svg?component';
import LogoutIcon from '@/assets/img/icons/logout.svg?component';
import Logo from '~/components/UI/Logo.vue';
import { useRouter } from 'vue-router';
import { useLoginModal } from '~/composables/useLoginModal';
import { useSDK } from '~/composables/useSDK';
import { useAPI } from '~/composables/useAPI';

const { nosana, prioFee } = useSDK();
const router = useRouter();
const { connected, publicKey, wallet, disconnect } = useWallet();
const { openWalletModal } = useLoginModal();

// Profile dropdown state  
const showUserProfileDropdown = ref(false);
const showMobileDropdown = ref(false);

// Mobile menu state
const showMobileMenu = ref(false);

// Profile dropdown functions
const toggleUserProfileDropdown = (event: Event) => {
  event.preventDefault();
  event.stopPropagation();
  event.stopImmediatePropagation();
  showUserProfileDropdown.value = !showUserProfileDropdown.value;
};

const openPriorityFeeSettings = () => {
  showUserProfileDropdown.value = false;
  updateShowSettingsModal(true);
};


const openLoginModal = () => {
  openWalletModal({ redirectToHost: true });
};

// Toggle dark mode
const toggleDarkMode = () => {
  useColorMode().preference = useColorMode().value === 'dark' ? 'light' : 'dark';
};

// Wallet address formatting
const getWalletAddress = () => {
  if (!publicKey.value) return '';
  const address = publicKey.value.toBase58();
  return `${address.slice(0, 4)}..${address.slice(-4)}`;
};

// NOS balance state
const nosBalance = ref<any | null>(null);
const loadingNosBalance = ref(false);


// Get NOS price from stats API with memoization
const { data: stats } = useAPI('/api/stats');
const nosPrice = computed(() => stats.value?.price || 0);

// Memoized NOS balance in USD to prevent recalculation on every render
const nosBalanceUSD = computed(() => {
  if (!nosBalance.value || !nosPrice.value) return 0;
  return (nosBalance.value.uiAmount || 0) * nosPrice.value;
});

const getNosBalanceUSD = () => nosBalanceUSD.value;

// Fetch NOS balance
const fetchNosBalance = async (signal?: AbortSignal) => {
  if (!connected.value || !publicKey.value) return;
  
  loadingNosBalance.value = true;
  try {
    // Note: SDK calls don't support AbortSignal directly, but we can check if aborted
    if (signal?.aborted) return;
    
    nosBalance.value = await nosana.value.solana.getNosBalance(publicKey.value.toBase58());
  } catch (error) {
    // Don't log errors for aborted requests
    if (!(error instanceof Error && error.name === 'AbortError') && !signal?.aborted) {
      console.error("Error fetching NOS balance:", error);
    }
    nosBalance.value = null;
  } finally {
    loadingNosBalance.value = false;
  }
};

// Logout function
const logout = async () => {
  showUserProfileDropdown.value = false;
  try {
    if (connected.value) {
      await disconnect();
    }
    router.push('/');
  } catch (error) {
    console.error('Error logging out:', error);
  }
};

// Close dropdown when clicking outside (onMounted)

// Debounced API calls with abort controllers to prevent race conditions
let nosBalanceTimeout: NodeJS.Timeout | null = null;
let nosBalanceController: AbortController | null = null;

const debouncedFetchNosBalance = () => {
  // Cancel any pending request
  if (nosBalanceController) {
    nosBalanceController.abort();
  }
  
  if (nosBalanceTimeout) clearTimeout(nosBalanceTimeout);
  nosBalanceTimeout = setTimeout(() => {
    nosBalanceController = new AbortController();
    fetchNosBalance(nosBalanceController.signal);
  }, 100);
};

// Watch for wallet connection changes (optimized)
watch([connected, publicKey], async (newValues, oldValues) => {
  const [newConnected, newPublicKey] = newValues;
  const [oldConnected, oldPublicKey] = oldValues || [];
  
  // Only fetch if wallet actually connected or changed
  if (newConnected && newPublicKey && 
      (!oldConnected || oldPublicKey?.toBase58() !== newPublicKey?.toBase58())) {
    debouncedFetchNosBalance();
  }
}, { immediate: true });

// Store click handler reference for cleanup
let clickHandler: ((e: Event) => void) | null = null;

onMounted(() => {
  if (process.client) {
    clickHandler = (e: Event) => {
      const target = e.target as HTMLElement;
      const dropdown = target?.closest?.('.profile-dropdown');
      const mobileDropdown = target?.closest?.('.mobile-avatar-dropdown');
      if (!dropdown && showUserProfileDropdown.value) showUserProfileDropdown.value = false;
      if (!mobileDropdown && showMobileDropdown.value) showMobileDropdown.value = false;
    };
    document.addEventListener('click', clickHandler);
  }
});

onUnmounted(() => {
  // Clean up timeouts to prevent memory leaks
  if (nosBalanceTimeout) {
    clearTimeout(nosBalanceTimeout);
    nosBalanceTimeout = null;
  }
  
  // Abort any pending requests
  if (nosBalanceController) {
    nosBalanceController.abort();
    nosBalanceController = null;
  }
  
  // Clean up event listener
  if (clickHandler && process.client) {
    document.removeEventListener('click', clickHandler);
    clickHandler = null;
  }
});

interface PrioFeeConfig {
  strategy: 'low' | 'medium' | 'high' | 'veryHigh';
  staticFee: number;
  dynamicPriorityFee: boolean;
  maxPriorityFee: number;
}

// Priority fee configuration mapping
const PRIO_FEE_CONFIGS: Record<string, PrioFeeConfig> = {
  low: {
    strategy: 'low',
    staticFee: 10000,
    dynamicPriorityFee: true,
    maxPriorityFee: 1000000
  },
  medium: {
    strategy: 'medium',
    staticFee: 100000,
    dynamicPriorityFee: true,
    maxPriorityFee: 15000000
  },
  high: {
    strategy: 'high',
    staticFee: 100000,
    dynamicPriorityFee: true,
    maxPriorityFee: 15000000
  },
  veryHigh: {
    strategy: 'veryHigh',
    staticFee: 100000,
    dynamicPriorityFee: true,
    maxPriorityFee: 15000000
  }
};

const setPrioFeeConfig = (level: keyof typeof PRIO_FEE_CONFIGS) => {
  const config = PRIO_FEE_CONFIGS[level];
  prioFee.value = config;
};

const props = defineProps({
  title: {
    type: String,
    required: true,
  },
  subtitle: {
    type: String,
    required: false,
  },
  hideButtons: {
    type: Boolean,
    default: false
  },
  modelValue: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['update:modelValue']);

const updateShowSettingsModal = (value: boolean) => {
  emit('update:modelValue', value);
};

// Expose functions for parent components to call
defineExpose({
  fetchNosBalance
});
</script>

<style scoped lang="scss">
@use "sass:color";

.vertical-divider {
  width: 1px;
  height: 2rem;
  background-color: $grey;
  flex-shrink: 0;
}

.dark-mode .vertical-divider {
  background-color: $grey-darker;
}

.navbar-tab {
  padding: 0.75rem 1.25rem;
  border-radius: 8px;
  font-size: 0.95rem;
  font-weight: 500;
  color: $grey;
  transition: all 0.2s ease;
  text-decoration: none;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  border: none;
  background: none;
  cursor: pointer;
  
  &:hover {
    color: $text;
    background: $grey-lightest;
  }
  
  &.is-active {
    color: $primary;
    background: rgba($primary, 0.08);
  }
  
  svg {
    width: 16px;
    height: 16px;
  }
}

.login-button {
  background: none;
  border: none;
  cursor: pointer;
  padding: 0.75rem 1.25rem;
  border-radius: 8px;
  font-size: 0.95rem;
  font-weight: 500;
  color: $grey;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.login-button:hover {
  color: $text;
  background: $grey-lightest;
}

.dark-mode .login-button {
  color: $grey-light;
}

.dark-mode .login-button:hover {
  color: $white;
  background: rgba($white, 0.05);
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: $success;
  box-shadow: 0 0 8px rgba($success, 0.4);
  flex-shrink: 0;
  align-self: center;
  margin: 0;
}

.profile-section {
  @media screen and (max-width: $tablet) {
    justify-content: space-between;
    width: 100%;
    flex-direction: column;
    align-items: flex-end;
    gap: 1rem;
    margin-top: 1rem;
  }
}


.profile-dropdown {
  position: relative;
  cursor: pointer;
  user-select: none;
  z-index: 100;
  flex-shrink: 0;
}

.profile-button {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.5rem 0.75rem;
  border-radius: 8px;
  transition: background-color 0.2s ease;
  background: $box-background-color;
}


.profile-avatar {
  width: 40px;
  height: 32px;
  border-radius: 8px;
  background: $grey;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.875rem;
  font-weight: 600;
  color: $white;
}

.wallet-avatar {
  background: transparent !important;
  padding: 0 !important;
}

.wallet-icon {
  width: 24px;
  height: 24px;
  object-fit: contain;
  border-radius: 6px;
}

.profile-info {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.125rem;
  max-width: 120px;
}

.profile-name {
  font-size: 0.875rem;
  font-weight: 500;
  color: $text;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  width: 100%;
}

.profile-balance {
  font-size: 0.75rem;
  font-weight: 600;
  color: $text;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  width: 100%;
}

.dropdown-arrow {
  transition: transform 0.2s ease;
  color: $grey;
}

.dropdown-arrow.is-flipped {
  transform: rotate(-90deg);
}

.dropdown-menu-simple {
  position: absolute;
  top: 100%;
  right: 0;
  z-index: 99999;
  background: $box-background-color;
  border-radius: 8px;
  box-shadow: 0 10px 25px rgba($black, 0.1);
  border: 1px solid $border;
  padding: 0;
  width: 100%;
}


.dropdown-item-simple {
  width: 100%;
  padding: 0.75rem 1rem;
  border: none;
  background: none;
  text-align: left;
  cursor: pointer;
  transition: background-color 0.2s ease;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-size: 0.875rem;
  color: $text;
}

.dropdown-item-simple:hover {
  background-color: $grey-lightest;
}

.dropdown-item-simple.logout-item {
  color: $danger;
}

.dropdown-item-simple.logout-item:hover {
  background-color: rgba($danger, 0.08);
}


.dropdown-icon {
  flex-shrink: 0;
  color: $grey;
  width: 16px;
  height: 16px;
}

.logout-item .dropdown-icon {
  color: $danger;
}

.dropdown-divider {


  border: none;
  margin: 0;
}

/* Dark mode styles */
.dark-mode .profile-button {
  background: $box-background-color-dark;
}

.dark-mode .profile-name {
  color: $white;
}

.dark-mode .profile-balance {
  color: $white;
}

.dark-mode .dropdown-menu-simple {
  background: $box-background-color-dark;
  border: none;
  box-shadow: 0 10px 25px rgba($black, 0.3);
}

.dark-mode .dropdown-item-simple {
  color: $white;
}

.dark-mode .dropdown-item-simple:hover {
  background-color: color.adjust($box-background-color-dark, $lightness: -5%);
}

.dark-mode .dropdown-item-simple.logout-item {
  color: $danger;
}

.dark-mode .dropdown-item-simple.logout-item:hover {
  background-color: rgba($danger, 0.12);
}

.dark-mode .dropdown-divider {
  background: $grey-darker;
}

.dark-mode .dropdown-icon {
  color: $grey-light;
}

.dark-mode .logout-item .dropdown-icon {
  color: $danger;
}

.dark-mode .profile-avatar {
  background: $grey-darker;
}

/* Sticky profile on deploy page */
.sticky-profile {
  position: fixed !important;
  top: 20px;
  right: 20px;
  z-index: 1000;
  background: $box-background-color;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba($black, 0.1);
}

.dark-mode .sticky-profile {
  background: $box-background-color-dark;
  box-shadow: 0 4px 12px rgba($black, 0.3);
}


// Mobile - hide title and divider
@media screen and (max-width: 768px) {
  .vertical-divider, .title {
    display: none;
  }
}

/* Hide TopBar profile section on mobile to prevent overlap with sidebar */
@media screen and (max-width: 1023px) {
  .profile-dropdown,
  .button.is-primary {
    display: none !important;
  }
}

.auth-avatar {
  background: transparent !important;
  padding: 0 !important;
}

.auth-icon {
  width: 24px;
  height: 24px;
  object-fit: contain;
  border-radius: 6px;
}

/* X (Twitter) icon specific styling */
img[alt="Twitter icon"] {
  background-color: $black;
  border-radius: 6px;
  padding: 4px;
}

.dark-mode img[alt="Twitter icon"] {
  background-color: $black;
}

// Dark mode styles
.dark-mode {
  .vertical-divider {
    background-color: $grey-darker;
  }
  
  .navbar-tab {
    color: $grey-light;
    
    &:hover {
      color: $white;
      background: rgba($white, 0.05);
    }
    
    &.is-active {
      color: $white;
      background: rgba($primary, 0.15);
    }
  }
  
  .status-link {
    color: $white;
    
    &:hover {
      background: rgba($white, 0.05);
    }
  }
  
  .mobile-menu-item {
    color: $white;
    
    &:hover {
      background: rgba($white, 0.05);
    }
    
    &.is-active {
      color: $white;
      background: rgba($primary, 0.15);
    }
  }
  
  .mobile-menu-toggle span {
    background: $white;
  }
}

.light-only {
  display: block;
}

.dark-only {
  display: none;
}

.dark-mode {
  .light-only {
    display: none;
  }
  
  .dark-only {
    display: block;
  }
}

/* Mobile wallet dropdown */
.mobile-avatar-dropdown {
  display: inline-flex;
  align-items: center;

  .dropdown-menu {
    right: 0;
    left: auto;
    min-width: 180px;
  }

  .dropdown-item {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
}

.mobile-avatar-trigger {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: $box-background-color;
  cursor: pointer;
  border: 1px solid $border;

  span {
    font-weight: 600;
    color: $text;
  }
}

.dark-mode {
  .mobile-avatar-trigger {
    background: $box-background-color-dark;
    border-color: $grey-darker;

    span {
      color: $white;
    }
  }
}
</style>
