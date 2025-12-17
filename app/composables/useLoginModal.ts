import { ref } from 'vue';

export type LoginMode = 'wallet';

interface LoginModalState {
  isOpen: boolean;
  mode: LoginMode;
  redirectPath?: string;
  redirectToHost?: boolean;
}

const modalState = ref<LoginModalState>({
  isOpen: false,
  mode: 'wallet',
  redirectPath: undefined,
  redirectToHost: false
});

export function useLoginModal() {
  const openModal = (
    mode: LoginMode = 'wallet',
    options?: { redirectPath?: string; redirectToHost?: boolean }
  ) => {
    modalState.value = {
      isOpen: true,
      mode,
      redirectPath: options?.redirectPath,
      redirectToHost: options?.redirectToHost ?? false
    };
  };

  const closeModal = () => {
    modalState.value.isOpen = false;
  };

  const openWalletModal = (options?: { redirectPath?: string; redirectToHost?: boolean }) => {
    openModal('wallet', options);
  };

  return {
    modalState: readonly(modalState),
    openModal,
    closeModal,
    openWalletModal
  };
}