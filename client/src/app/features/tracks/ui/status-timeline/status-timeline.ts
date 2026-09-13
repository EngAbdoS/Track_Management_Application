import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { StatusChangeDto } from '../../../../models/api.models';

/**
 * The audit trail. `source` is what makes an entry readable: a status the system set
 * while distributing should not look like a decision someone made by hand.
 */
@Component({
  selector: 'app-status-timeline',
  imports: [DatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ol class="timeline">
      @for (entry of entries(); track $index) {
        <li class="entry">
          <span class="entry__marker" aria-hidden="true"></span>

          <p class="entry__change">
            @if (entry.oldStatus) {
              <span class="muted">{{ entry.oldStatus }}</span>
              <span class="entry__arrow muted" aria-label="changed to">&rarr;</span>
            }
            <strong>{{ entry.newStatus }}</strong>
          </p>

          <p class="entry__meta muted">
            {{ describe(entry) }} · {{ entry.changedAt | date: 'd MMM y, HH:mm' }}
          </p>

          @if (entry.reason) {
            <p class="entry__reason">“{{ entry.reason }}”</p>
          }
        </li>
      } @empty {
        <li class="muted">No changes recorded.</li>
      }
    </ol>
  `,
  styles: `
    .timeline {
      list-style: none;
      margin: 0;
      padding: 0;
      display: flex;
      flex-direction: column;
      gap: var(--space-4);
    }

    .entry {
      position: relative;
      padding-inline-start: var(--space-5);

      &:not(:last-child)::before {
        content: '';
        position: absolute;
        inset-inline-start: 4px;
        top: 14px;
        bottom: calc(-1 * var(--space-4));
        width: 1px;
        background: var(--border);
      }
    }

    .entry__marker {
      position: absolute;
      inset-inline-start: 0;
      top: 6px;
      width: 9px;
      height: 9px;
      border-radius: var(--radius-full);
      background: var(--border-strong);
    }

    .entry:last-child .entry__marker {
      background: var(--accent);
    }

    .entry__arrow {
      margin-inline: var(--space-1);
    }

    .entry__meta {
      font-size: var(--text-sm);
    }

    .entry__reason {
      margin-block-start: var(--space-1);
      padding-inline-start: var(--space-3);
      border-inline-start: 2px solid var(--border);
      font-size: var(--text-sm);
    }
  `,
})
export class StatusTimeline {
  /** Arrives oldest-first from the API and is shown in that order. */
  readonly entries = input.required<readonly StatusChangeDto[]>();

  protected describe(entry: StatusChangeDto): string {
    switch (entry.source) {
      case 'Created':
        return `Created by ${entry.changedByUsername}`;
      case 'DistributeAction':
        return `Set automatically when ${entry.changedByUsername} distributed the track`;
      case 'ManualUpdate':
        return `Changed by ${entry.changedByUsername}`;
    }
  }
}
