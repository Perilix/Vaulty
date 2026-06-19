export type Tone = 'pos' | 'warn' | 'danger' | 'muted' | 'primary';
export type InvoiceStatus = 'paid' | 'pending' | 'overdue' | 'draft';

export interface Client {
  id: string;
  name: string;
  type: 'entreprise' | 'particulier';
  contact?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  siret?: string;
  conditions?: string;
  statut: 'Bon payeur' | 'À surveiller' | 'En retard';
  ca: number;
  encours: number;
  factures: number;
  payees: number;
  invoices?: Invoice[];
}

export interface InvoiceLine {
  id?: number;
  description: string;
  qty: number;
  unit_price: number;
  position?: number;
}

export interface Invoice {
  id: string;
  client_id?: string;
  client_name: string;
  issued_on?: string;
  due_on?: string;
  statut: InvoiceStatus;
  tva_rate?: number;
  notes?: string;
  ht: number;
  tva: number;
  ttc: number;
  lines?: InvoiceLine[];
}

export interface DashboardData {
  kpis: Record<string, any>;
  upcoming: Array<{ id: string; client_name: string; due_on: string; statut: InvoiceStatus; ht: number }>;
}

export const STATUS_LABELS: Record<InvoiceStatus, { label: string; tone: Tone }> = {
  paid: { label: 'Payée', tone: 'pos' },
  pending: { label: 'En attente', tone: 'warn' },
  overdue: { label: 'En retard', tone: 'danger' },
  draft: { label: 'Brouillon', tone: 'muted' },
};

export const STATUT_TONE: Record<string, Tone> = {
  'Bon payeur': 'pos',
  'À surveiller': 'warn',
  'En retard': 'danger',
};

/** Formatage monétaire FR identique au prototype */
export function euro(n: number | string | null | undefined, dec = 0): string {
  const v = Number(n) || 0;
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: dec,
    maximumFractionDigits: dec,
  }).format(v);
}

export function toneVar(t?: Tone | null): { fg: string; bg: string } {
  switch (t) {
    case 'pos': return { fg: 'var(--pos)', bg: 'var(--pos-soft)' };
    case 'warn': return { fg: 'var(--warn)', bg: 'var(--warn-soft)' };
    case 'danger': return { fg: 'var(--danger)', bg: 'var(--danger-soft)' };
    case 'primary': return { fg: 'var(--primary)', bg: 'var(--primary-soft)' };
    default: return { fg: 'var(--text-3)', bg: 'var(--surface-inset)' };
  }
}

/** "2026-06-02" -> "02 juin" */
const MONTHS_FR = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'];
export function frDate(iso?: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return `${String(d.getUTCDate()).padStart(2, '0')} ${MONTHS_FR[d.getUTCMonth()]}`;
}

export function daysOverdue(due?: string | null): number {
  if (!due) return 0;
  const d = new Date(due).getTime();
  const today = new Date('2026-06-19').getTime();
  return Math.max(0, Math.floor((today - d) / 86400000));
}
