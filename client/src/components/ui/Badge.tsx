import type { MessageStatus } from '../../types/lead';

const config: Record<MessageStatus, { label: string; className: string }> = {
  SENT: { label: 'Sent', className: 'bg-green-100 text-green-800' },
  FAILED: { label: 'Failed', className: 'bg-red-100 text-red-800' },
  PENDING: { label: 'Pending', className: 'bg-yellow-100 text-yellow-800' },
};

interface BadgeProps {
  status: MessageStatus;
}

export default function Badge({ status }: BadgeProps) {
  const { label, className } = config[status];
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${className}`}>
      {label}
    </span>
  );
}
