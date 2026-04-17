import { Modal } from 'antd'

export interface CreateModalProps {
  open: boolean
  onClose: () => void
  onSuccess: () => void
}

export default function CreateModal({ open, onClose }: CreateModalProps) {
  return (
    <Modal open={open} onCancel={onClose} title="New GlobalConnectionIpRestriction" footer={null}>
      <p>TODO: wire in Task 23</p>
    </Modal>
  )
}
