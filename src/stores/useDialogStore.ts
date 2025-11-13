import { create } from 'zustand'

interface DialogState {
  isOpen: boolean
  title?: string
  message: string
  type: 'alert' | 'confirm'
  confirmText?: string
  cancelText?: string
  onConfirm?: () => void | Promise<void>
  onCancel?: () => void | Promise<void>
  showDialog: (config: DialogConfig) => void
  closeDialog: () => void
}

export interface DialogConfig {
  title?: string
  message: string
  type?: 'alert' | 'confirm'
  confirmText?: string
  cancelText?: string
  onConfirm?: () => void | Promise<void>
  onCancel?: () => void | Promise<void>
}

export const useDialogStore = create<DialogState>((set) => ({
  isOpen: false,
  message: '',
  type: 'alert',
  confirmText: '확인',
  cancelText: '취소',

  showDialog: (config) => {
    set({
      isOpen: true,
      title: config.title,
      message: config.message,
      type: config.type || 'alert',
      confirmText: config.confirmText || '확인',
      cancelText: config.cancelText || '취소',
      onConfirm: config.onConfirm,
      onCancel: config.onCancel,
    })
  },

  closeDialog: () => {
    set({
      isOpen: false,
      title: undefined,
      message: '',
      type: 'alert',
      confirmText: '확인',
      cancelText: '취소',
      onConfirm: undefined,
      onCancel: undefined,
    })
  },
}))
