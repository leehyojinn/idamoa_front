'use client'

import StartChatButton from '@/components/chat/StartChatButton'

interface CompanyChatButtonProps {
  ownerUuid: string
  companyName: string
  className?: string
}

export default function CompanyChatButton({
  ownerUuid,
  companyName,
  className = '',
}: CompanyChatButtonProps) {
  return (
    <StartChatButton
      targetUserUuid={ownerUuid}
      targetUserName={companyName}
      className={className}
    />
  )
}
