import { DistributionStatus, TrackStatus } from '../../../models/api.models';

/**
 * The domain has two independent status concepts and the UI must never let them be
 * read as one. `track.status` says where a track sits in our workflow; a distribution
 * status says what one DSP did with it. A track can be Distributed and live nowhere.
 *
 * They are therefore given different shapes, not just different colours: track status
 * renders as a solid pill, a DSP status as a dot with a glyph. Colour alone would also
 * fail anyone who cannot separate Rejected (red) from Blocked (maroon), which is why
 * every DSP status carries its own glyph as well.
 */

export interface StatusPresentation {
  label: string;
  /** CSS custom property holding the colour for this status. */
  token: string;
  hint: string;
}

export const TRACK_STATUS_PRESENTATION: Record<TrackStatus, StatusPresentation> = {
  Draft: {
    label: 'Draft',
    token: '--status-draft',
    hint: 'Created, not yet sent to any DSP.',
  },
  Submitted: {
    label: 'Submitted',
    token: '--status-submitted',
    hint: 'In flight.',
  },
  Distributed: {
    label: 'Distributed',
    token: '--status-distributed',
    hint: 'Sent to at least one DSP — not necessarily live on any of them.',
  },
};

export type DspGlyph = 'clock' | 'dot' | 'cross' | 'pause' | 'slash';

export interface DistributionPresentation extends StatusPresentation {
  glyph: DspGlyph;
}

export const DISTRIBUTION_STATUS_PRESENTATION: Record<DistributionStatus, DistributionPresentation> =
  {
    Pending: {
      label: 'Pending',
      token: '--dsp-pending',
      glyph: 'clock',
      hint: 'Submitted, awaiting a decision.',
    },
    Live: { label: 'Live', token: '--dsp-live', glyph: 'dot', hint: 'Available on this DSP.' },
    Rejected: {
      label: 'Rejected',
      token: '--dsp-rejected',
      glyph: 'cross',
      hint: 'The DSP refused the track.',
    },
    Paused: {
      label: 'Paused',
      token: '--dsp-paused',
      glyph: 'pause',
      hint: 'Temporarily withdrawn; can go live again.',
    },
    Blocked: {
      label: 'Blocked',
      token: '--dsp-blocked',
      glyph: 'slash',
      hint: 'Taken down by the DSP.',
    },
  };

/**
 * The lifecycle the API documents but does **not** enforce — it accepts any value.
 * Offering only these keeps the UI from writing nonsense the server would happily store.
 * Pending is terminal-ish in both failure directions; Paused can return to Live.
 */
export const ALLOWED_DISTRIBUTION_TRANSITIONS: Record<DistributionStatus, DistributionStatus[]> = {
  Pending: ['Live', 'Rejected'],
  Live: ['Paused', 'Blocked'],
  Paused: ['Live', 'Blocked'],
  Rejected: [],
  Blocked: [],
};

/**
 * "Is this actually live anywhere" is a question about distributions, never about
 * track.status — a Distributed track whose DSPs all rejected it is live nowhere.
 */
export function isLiveSomewhere(distributions: readonly { status: DistributionStatus }[]): boolean {
  return distributions.some((distribution) => distribution.status === 'Live');
}
