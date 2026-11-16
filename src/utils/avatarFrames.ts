export type PresetAvatarFrameId =
  | 'orange-gold'
  | 'island-flow'
  | 'emerald-mint'
  | 'ocean-cyan'
  | 'violet-neon';

export type AvatarFrameId =
  | PresetAvatarFrameId
  | `#${string}`
  | `custom:${'static' | 'spin'}:${string}`;

export interface AvatarFrameOption {
  id: string;
  label: string;
  background: string;
  isAnimated?: boolean;
  colors: string[];
}

export const AVATAR_FRAMES: AvatarFrameOption[] = [
  {
    id: 'orange-gold',
    label: 'Orange Gold',
    background: 'linear-gradient(135deg, #ea580c 0%, #f59e0b 52%, #fde047 100%)',
    colors: ['#ea580c', '#f59e0b', '#fde047'],
  },
  {
    id: 'island-flow',
    label: 'Dynamic Flow',
    background:
      'conic-gradient(from 0deg, #ea580c 0%, #f59e0b 25%, #ffffff 48%, #fbbf24 72%, #ea580c 100%)',
    isAnimated: true,
    colors: ['#ea580c', '#ffffff', '#fbbf24'],
  },
  {
    id: 'emerald-mint',
    label: 'Emerald',
    background: 'linear-gradient(135deg, #059669 0%, #10b981 55%, #6ee7b7 100%)',
    colors: ['#059669', '#10b981', '#6ee7b7'],
  },
  {
    id: 'ocean-cyan',
    label: 'Ocean',
    background: 'linear-gradient(135deg, #0284c7 0%, #38bdf8 55%, #bae6fd 100%)',
    colors: ['#0284c7', '#38bdf8', '#bae6fd'],
  },
  {
    id: 'violet-neon',
    label: 'Violet',
    background: 'linear-gradient(135deg, #7c3aed 0%, #a855f7 55%, #e9d5ff 100%)',
    colors: ['#7c3aed', '#a855f7', '#e9d5ff'],
  },
];

export const DEFAULT_AVATAR_FRAME: AvatarFrameId = 'orange-gold';

export function buildCustomFrameBackground(colors: string[], isAnimated: boolean): string {
  const valid = colors.filter((c) => /^#[0-9a-fA-F]{6}$/.test(c));
  const list = valid.length > 0 ? valid : ['#ea580c'];

  if (list.length === 1) {
    return list[0];
  }

  if (isAnimated) {
    if (list.length === 2) {
      return `conic-gradient(from 0deg, ${list[0]} 0%, ${list[1]} 50%, ${list[0]} 100%)`;
    }
    return `conic-gradient(from 0deg, ${list[0]} 0%, ${list[1]} 33%, ${list[2]} 66%, ${list[0]} 100%)`;
  }

  if (list.length === 2) {
    return `linear-gradient(135deg, ${list[0]} 0%, ${list[1]} 100%)`;
  }
  return `linear-gradient(135deg, ${list[0]} 0%, ${list[1]} 52%, ${list[2]} 100%)`;
}

export function serializeCustomFrame(colors: string[], isAnimated: boolean): AvatarFrameId {
  const clean = colors.slice(0, 3).map((c) => c.toLowerCase());
  const mode = clean.length > 1 && isAnimated ? 'spin' : 'static';
  return `custom:${mode}:${clean.join(',')}`;
}

export function getAvatarFrame(id?: string | null): AvatarFrameOption {
  if (!id) return AVATAR_FRAMES[0];

  if (id.startsWith('custom:')) {
    const [, mode, rawColors] = id.split(':');
    const colors = (rawColors || '#ea580c')
      .split(',')
      .filter((c) => /^#[0-9a-fA-F]{6}$/.test(c));
    const safeColors = colors.length > 0 ? colors : ['#ea580c'];
    const isAnimated = mode === 'spin' && safeColors.length > 1;

    return {
      id,
      label: isAnimated ? 'Custom Gerak' : 'Custom',
      background: buildCustomFrameBackground(safeColors, isAnimated),
      isAnimated,
      colors: safeColors,
    };
  }

  if (id.startsWith('#') && /^#[0-9a-fA-F]{6}$/.test(id)) {
    return {
      id,
      label: 'Custom',
      background: id,
      isAnimated: false,
      colors: [id],
    };
  }

  return AVATAR_FRAMES.find((f) => f.id === id) ?? AVATAR_FRAMES[0];
}
