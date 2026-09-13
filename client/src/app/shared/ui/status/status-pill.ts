import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { TrackStatus } from '../../../models/api.models';
import { TRACK_STATUS_PRESENTATION } from './status-presentation';

/** Track status — the workflow level. Solid pill, deliberately unlike a DSP status. */
@Component({
  selector: 'app-status-pill',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span class="pill" [style.--tone]="'var(' + presentation().token + ')'" [title]="presentation().hint">
      {{ presentation().label }}
    </span>
  `,
  styles: `
    .pill {
      display: inline-block;
      padding: 2px var(--space-3);
      border-radius: var(--radius-full);
      background: color-mix(in srgb, var(--tone) 16%, transparent);
      color: var(--tone);
      font-size: var(--text-xs);
      font-weight: 650;
      letter-spacing: 0.01em;
      white-space: nowrap;
    }
  `,
})
export class StatusPill {
  readonly status = input.required<TrackStatus>();

  protected readonly presentation = computed(() => TRACK_STATUS_PRESENTATION[this.status()]);
}
