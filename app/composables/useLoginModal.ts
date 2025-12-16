import { ref } from 'vue';

export type LoginMode = 'wallet';

interface LoginModalState {
  isOpen: boolean;
  mode: LoginMode;
  redirectPath?: string;
}

const modalState = ref<LoginModalState>({
  isOpen: false,
  mode: 'wallet',
  redirectPath: undefined
});

export function useLoginModal() {
  const openModal = (mode: LoginMode = 'wallet', redirectPath?: string) => {
    modalState.value = {
      isOpen: true,
      mode,
      redirectPath: redirectPath
    };
  };

  const closeModal = () => {
    modalState.value.isOpen = false;
  };

  const openWalletModal = (redirectPath?: string) => {
    openModal('wallet', redirectPath);
  };

  return {
    modalState: readonly(modalState),
    openModal,
    closeModal,
    openWalletModal
  };
}