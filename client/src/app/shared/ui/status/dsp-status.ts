import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { DistributionStatus } from '../../../models/api.models';
import { DISTRIBUTION_STATUS_PRESENTATION } from './status-presentation';

/**
 * What one DSP did with a track. Dot plus glyph plus label — never a pill, so it cannot
 * be mistaken for the track's own workflow status. The glyph is not decoration: Rejected
 * and Blocked are both reds and must stay distinguishable without colour vision.
 */
@Component({
  selector: 'app-dsp-status',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span class="status" [style.--tone]="'var(' + presentation().token + ')'" [title]="presentation().hint">
      <svg class="glyph" viewBox="0 0 16 16" aria-hidden="true">
        @switch (presentation().glyph) {
          @case ('dot') {
            <circle cx="8" cy="8" r="5" fill="currentColor" />
          }
          @case ('clock') {
            <circle cx="8" cy="8" r="6" fill="none" stroke="currentColor" stroke-width="1.6" />
            <path d="M8 4.6V8l2.4 1.6" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" fill="none" />
          }
          @case ('cross') {
            <path d="M4.5 4.5l7 7M11.5 4.5l-7 7" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" />
          }
          @case ('pause') {
            <path d="M6 4v8M10 4v8" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
          }
          @case ('slash') {
            <circle cx="8" cy="8" r="6" fill="none" stroke="currentColor" stroke-width="1.6" />
            <path d="M4.2 11.8 11.8 4.2" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
          }
        }
      </svg>
      <span class="label">{{ presentation().label }}</span>
    </span>
  `,
  styles: `
    .status {
      display: inline-flex;
      align-items: center;
      gap: var(--space-2);
      color: var(--tone);
      font-weight: 550;
      white-space: nowrap;
    }

    .glyph {
      width: 14px;
      height: 14px;
      flex-shrink: 0;
    }

    .label {
      color: var(--text);
    }
  `,
})
export class DspStatus {
  readonly status = input.required<DistributionStatus>();

  protected readonly presentation = computed(() => DISTRIBUTION_STATUS_PRESENTATION[this.status()]);
}
