import { Badge } from '@/components/ui/badge'

const STATUS_CONFIG: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'success' | 'warning' | 'info' | 'outline'; label: string }> = {
  Pendente: { variant: 'warning', label: 'Pendente' },
  Pago: { variant: 'info', label: 'Pago' },
  'Preparação': { variant: 'info', label: 'Preparação' },
  Enviado: { variant: 'info', label: 'Enviado' },
  Entregue: { variant: 'success', label: 'Entregue' },
  Cancelado: { variant: 'destructive', label: 'Cancelado' },
}

export function StatusBadge({ status }: { status: string }) {
  const config = STATUS_CONFIG[status] || { variant: 'outline' as const, label: status }
  return <Badge variant={config.variant}>{config.label}</Badge>
}

export const ORDER_STATUSES = ['Pendente', 'Pago', 'Preparação', 'Enviado', 'Entregue', 'Cancelado']
