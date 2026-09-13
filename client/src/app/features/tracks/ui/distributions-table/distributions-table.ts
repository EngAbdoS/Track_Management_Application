import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, input, signal } from '@angular/core';
import { TrackDistributionDto } from '../../../../models/api.models';
import { DspStatus } from '../../../../shared/ui/status/dsp-status';
import { StatusTimeline } from '../status-timeline/status-timeline';

@Component({
  selector: 'app-distributions-table',
  imports: [DatePipe, DspStatus, StatusTimeline],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="table-wrap">
      <table class="table">
        <caption class="sr-only">
          Digital service providers this track was submitted to, and what each did with it
        </caption>
        <thead>
          <tr>
            <th scope="col">DSP</th>
            <th scope="col">Submitted</th>
            <th scope="col">Status</th>
            <th scope="col"><span class="sr-only">History</span></th>
          </tr>
        </thead>
        <tbody>
          @for (distribution of distributions(); track distribution.id) {
            <tr>
              <td>{{ distribution.dspName }}</td>
              <td class="num">{{ distribution.submittedAt | date: 'd MMM y' }}</td>
              <td><app-dsp-status [status]="distribution.status" /></td>
              <td class="actions">
                <button
                  type="button"
                  class="toggle"
                  [attr.aria-expanded]="isExpanded(distribution.id)"
                  [attr.aria-controls]="'history-' + distribution.id"
                  (click)="toggle(distribution.id)"
                >
                  {{ isExpanded(distribution.id) ? 'Hide' : 'History' }}
                  <span class="count muted">({{ distribution.statusHistory.length }})</span>
                </button>
              </td>
            </tr>

            @if (isExpanded(distribution.id)) {
              <tr class="history-row">
                <td [id]="'history-' + distribution.id" colspan="4">
                  <app-status-timeline [entries]="distribution.statusHistory" />
                </td>
              </tr>
            }
          }
        </tbody>
      </table>
    </div>
  `,
  styles: `
    .actions {
      text-align: end;
    }

    .toggle {
      padding: var(--space-1) var(--space-3);
      border: 1px solid var(--border);
      border-radius: var(--radius);
      background: transparent;
      color: var(--text-muted);
      font-size: var(--text-sm);

      &:hover {
        background: var(--surface-2);
        color: var(--text);
      }
    }

    .history-row td {
      background: var(--surface-2);
      padding-block: var(--space-4);
    }
  `,
})
export class DistributionsTable {
  readonly distributions = input.required<readonly TrackDistributionDto[]>();

  private readonly expanded = signal<ReadonlySet<string>>(new Set());

  protected isExpanded(id: string): boolean {
    return this.expanded().has(id);
  }

  protected toggle(id: string): void {
    this.expanded.update((current) => {
      const next = new Set(current);

      if (!next.delete(id)) {
        next.add(id);
      }

      return next;
    });
  }
}
