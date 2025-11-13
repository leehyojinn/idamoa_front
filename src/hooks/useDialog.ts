import { useDialogStore, DialogConfig } from '@/stores/useDialogStore'

export const useDialog = () => {
  const { showDialog, closeDialog } = useDialogStore()

  /**
   * 알림 다이얼로그 표시 (확인 버튼만)
   */
  const alert = (message: string, config?: Partial<DialogConfig>) => {
    showDialog({
      message,
      type: 'alert',
      ...config,
    })
  }

  /**
   * 확인 다이얼로그 표시 (확인/취소 버튼)
   */
  const confirm = (message: string, config?: Partial<DialogConfig>) => {
    showDialog({
      message,
      type: 'confirm',
      ...config,
    })
  }

  /**
   * Promise 기반 confirm - async/await으로 사용 가능
   */
  const confirmAsync = (message: string, config?: Partial<Omit<DialogConfig, 'onConfirm' | 'onCancel'>>) => {
    return new Promise<boolean>((resolve) => {
      showDialog({
        message,
        type: 'confirm',
        ...config,
        onConfirm: () => resolve(true),
        onCancel: () => resolve(false),
      })
    })
  }

  return {
    alert,
    confirm,
    confirmAsync,
    showDialog,
    closeDialog,
  }
}
