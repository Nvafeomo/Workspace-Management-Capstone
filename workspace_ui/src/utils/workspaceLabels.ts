import type { WorkspaceType } from '../types';

const LABELS: Record<WorkspaceType, string> = {
  ROOM: 'Room',
  LAB: 'Lab',
  EQUIPMENT: 'Equipment',
};

const STYLES: Record<WorkspaceType, string> = {
  ROOM: 'bg-sky-100 text-sky-800 ring-sky-200/70',
  LAB: 'bg-violet-100 text-violet-800 ring-violet-200/70',
  EQUIPMENT: 'bg-amber-100 text-amber-800 ring-amber-200/70',
};

export function workspaceTypeLabel(type?: WorkspaceType | string | null): string {
  if (!type || !(type in LABELS)) return LABELS.EQUIPMENT;
  return LABELS[type as WorkspaceType];
}

export function workspaceTypeStyle(type?: WorkspaceType | string | null): string {
  if (!type || !(type in STYLES)) return STYLES.EQUIPMENT;
  return STYLES[type as WorkspaceType];
}

export function isReservableWorkspace(type?: WorkspaceType | string | null): boolean {
  return type === 'ROOM' || type === 'LAB';
}
