import { DISTRIBUTION_STATUSES, TRACK_STATUSES } from '../../../models/api.models';
import {
  ALLOWED_DISTRIBUTION_TRANSITIONS,
  DISTRIBUTION_STATUS_PRESENTATION,
  TRACK_STATUS_PRESENTATION,
  isLiveSomewhere,
} from './status-presentation';

describe('status presentation', () => {
  it('covers every status the API can send', () => {
    for (const status of TRACK_STATUSES) {
      expect(TRACK_STATUS_PRESENTATION[status]).toBeDefined();
    }
    for (const status of DISTRIBUTION_STATUSES) {
      expect(DISTRIBUTION_STATUS_PRESENTATION[status]).toBeDefined();
    }
  });

  it('gives every DSP status its own glyph, so colour is never the only signal', () => {
    const glyphs = DISTRIBUTION_STATUSES.map((s) => DISTRIBUTION_STATUS_PRESENTATION[s].glyph);

    expect(new Set(glyphs).size).toBe(DISTRIBUTION_STATUSES.length);
  });

  it('keeps Rejected and Blocked distinguishable without colour', () => {
    // Both are reds; a red-blind user has only the glyph and the label to go on.
    expect(DISTRIBUTION_STATUS_PRESENTATION.Rejected.glyph).not.toBe(
      DISTRIBUTION_STATUS_PRESENTATION.Blocked.glyph,
    );
  });

  it('does not describe a Distributed track as live', () => {
    expect(TRACK_STATUS_PRESENTATION.Distributed.hint.toLowerCase()).toContain('not necessarily');
  });
});

describe('ALLOWED_DISTRIBUTION_TRANSITIONS', () => {
  it('follows the documented lifecycle', () => {
    expect(ALLOWED_DISTRIBUTION_TRANSITIONS.Pending).toEqual(['Live', 'Rejected']);
    expect(ALLOWED_DISTRIBUTION_TRANSITIONS.Live).toEqual(['Paused', 'Blocked']);
    expect(ALLOWED_DISTRIBUTION_TRANSITIONS.Paused).toContain('Live');
  });

  it('treats Rejected and Blocked as terminal', () => {
    expect(ALLOWED_DISTRIBUTION_TRANSITIONS.Rejected).toEqual([]);
    expect(ALLOWED_DISTRIBUTION_TRANSITIONS.Blocked).toEqual([]);
  });

  it('never offers a status as a transition to itself', () => {
    for (const status of DISTRIBUTION_STATUSES) {
      expect(ALLOWED_DISTRIBUTION_TRANSITIONS[status]).not.toContain(status);
    }
  });
});

describe('isLiveSomewhere', () => {
  it('is false when a Distributed track was refused everywhere', () => {
    expect(isLiveSomewhere([{ status: 'Rejected' }, { status: 'Blocked' }])).toBe(false);
  });

  it('is true as soon as one DSP has it live', () => {
    expect(isLiveSomewhere([{ status: 'Rejected' }, { status: 'Live' }])).toBe(true);
  });

  it('is false for a track that was never distributed', () => {
    expect(isLiveSomewhere([])).toBe(false);
  });
});
