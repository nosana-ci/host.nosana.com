<template>
  <div class="mt-5">
    <div class="columns mt-4">
      <div class="column is-6">
        <div class="box mb-0">
          <div class="has-text-centered">
            <p class="heading mb-2">Available to Claim</p>
            <div class="mb-4">
              <p class="title is-3 mb-1" v-if="!loadingRewards">
                {{ claimableRewards.toFixed(6) }}
                <span class="has-text-grey-dark is-size-6">NOS</span>
              </p>
              <p class="title is-3 has-text-grey mb-1" v-else>
                - <span class="has-text-grey-dark is-size-6">NOS</span>
              </p>
            </div>

            <button
              class="button is-success is-fullwidth"
              :class="{ 'is-loading': claimingRewards }"
              :disabled="claimingRewards || !connected || claimableRewards <= 0"
              @click="claimRewards"
            >
              <span>{{
                claimingRewards ? "Claiming..." : "Claim Rewards"
              }}</span>
            </button>
          </div>
        </div>

        <!-- New Box for Total Claimed Rewards -->
        <div class="box mt-0">
          <div class="has-text-centered">
            <p class="heading mb-2">Total Claimed</p>
            <div class="mb-0">
              <!-- Adjusted margin for consistency if no button -->
              <p class="title is-3 mb-1" v-if="!loadingRewards">
                {{ totalClaimedRewards.toFixed(6) }}
                <span class="has-text-grey-dark is-size-6">NOS</span>
              </p>
              <p class="title is-3 has-text-grey mb-1" v-else>
                - <span class="has-text-grey-dark is-size-6">NOS</span>
              </p>
            </div>
          </div>
        </div>
      </div>

      <div class="column is-6">
        <div class="box">
          <div
            class="content is-flex is-flex-direction-column is-align-items-center"
          >
            <h4 class="title is-6 mb-3 has-text-centered">How It Works</h4>

            <div class="uptime-steps">
              <div class="step-item mb-3">
                <span class="step-number">1</span>
                <span class="step-text"
                  >Keep your node online and responsive</span
                >
              </div>
              <div class="step-item mb-3">
                <span class="step-number">2</span>
                <span class="step-text"
                  >Accumulate uptime rewards automatically</span
                >
              </div>
              <div class="step-item">
                <span class="step-number">3</span>
                <span class="step-text"
                  >Claim your earned NOS tokens anytime. Rewards are updated
                  daily.</span
                >
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { useToast } from "vue-toastification";
import InfoIcon from '@/assets/img/icons/info.svg?component';
import { createSignedWalletAuthHeader } from "~/utils/createSignedWalletAuthHeader";

// Props
interface Props {
  rewards: any;
  loadingRewards: boolean;
  connected: boolean;
  publicKey: any;
  wallet: any;
}

// Emits
interface Emits {
  (e: "refresh-rewards"): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const toast = useToast();
const config = useRuntimeConfig().public;

// Uptime rewards logic
const claimingRewards = ref(false);
const claimableRewards = computed(() => {
  const rawValue = props.rewards?.claimableUptimeNosRewards ?? 0;

  return Number(rawValue) || 0;
});

const totalClaimedRewards = computed(() => {
  const rawValue = props.rewards?.totalClaimedUptimeNosRewards ?? 0;

  return Number(rawValue) || 0;
});

const showClaimRewards = computed(() => {
  return claimableRewards.value > 0;
});

const claimRewards = async () => {
  if (!props.connected || !props.publicKey) {
    toast.error("Please connect your wallet");
    return;
  }

  claimingRewards.value = true;

  try {
    const authHeader = await createSignedWalletAuthHeader({
      connected: props.connected,
      publicKey: props.publicKey,
      wallet: props.wallet,
      message: props.publicKey.toString(), // Use public key as message for signing
    });

    const response = (await $fetch(`${config.apiBase}/api/nodes/payment`, {
      method: "POST",
      headers: {
        Authorization: authHeader,
        "Content-Type": "application/json",
      },
    })) as {
      message: string;
      success: boolean;
      claimableAmount: number;
      transactionSignature?: string;
    };

    if (response.success) {
      toast.success(
        `Successfully claimed ${response.claimableAmount.toFixed(6)} NOS!`
      );

      // Show transaction link if provided
      if (response.transactionSignature) {
        const explorerUrl = `https://solscan.io/tx/${response.transactionSignature}`;
        toast.success(`Transaction: ${response.transactionSignature}`, {
          onClick: () => window.open(explorerUrl, "_blank"),
          timeout: 10000,
        });
      }

      emit("refresh-rewards");
    } else {
      toast.error(response.message || "Failed to claim rewards");
    }
  } catch (error: any) {
    console.error("Error claiming rewards:", error);
    const errorMessage =
      error?.data?.message || error?.message || "Failed to claim rewards";
    toast.error(errorMessage);
  } finally {
    claimingRewards.value = false;
  }
};
</script>

<style scoped>
.heading {
  text-transform: uppercase;
  font-size: 0.8rem;
  font-weight: 600;
  color: #7a7a7a;
  margin-bottom: 0.5rem;
}

.uptime-steps {
  margin-top: 1rem;
}

.step-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.step-number {
  background: linear-gradient(135deg, #3273dc 0%, #2366d1 100%);
  color: white;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  font-weight: 600;
  flex-shrink: 0;
}

.step-text {
  color: #4a4a4a;
  font-size: 0.9rem;
  line-height: 1.4;
}
</style>
