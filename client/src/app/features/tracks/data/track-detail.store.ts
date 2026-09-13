import { Injectable, computed, inject, signal } from '@angular/core';
import { ApiError, parseApiError } from '../../../core/http/api-error';
import { ToastStore } from '../../../core/notifications/toast.store';
import {
  DistributionStatus,
  TrackDetailDto,
  TrackStatus,
  UpdateMetadataRequest,
} from '../../../models/api.models';
import { isLiveSomewhere } from '../../../shared/ui/status/status-presentation';
import { TracksApi } from './tracks.api';

@Injectable()
export class TrackDetailStore {
  private readonly api = inject(TracksApi);
  private readonly toasts = inject(ToastStore);

  private readonly _track = signal<TrackDetailDto | null>(null);
  private readonly _loading = signal(false);
  private readonly _error = signal<ApiError | null>(null);
  private readonly _saving = signal(false);

  readonly track = this._track.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();
  readonly saving = this._saving.asReadonly();

  readonly distributions = computed(() => this._track()?.distributions ?? []);

  /**
   * Deliberately computed from the distributions. A Distributed track whose DSPs all
   * rejected it is live nowhere, so track.status can never answer this.
   */
  readonly liveCount = computed(
    () => this.distributions().filter((distribution) => distribution.status === 'Live').length,
  );
  readonly isLive = computed(() => isLiveSomewhere(this.distributions()));

  async load(id: string): Promise<void> {
    this._loading.set(true);
    this._error.set(null);

    try {
      this._track.set(await this.api.getById(id));
    } catch (cause) {
      this._error.set(parseApiError(cause));
      this._track.set(null);
    } finally {
      this._loading.set(false);
    }
  }

  /**
   * Every write refetches the whole track rather than patching local state: one GET
   * returns the new status, the new distribution rows *and* the new audit entries, which
   * no client-side merge could reconstruct.
   */
  async distribute(id: string, dspIds: string[]): Promise<void> {
    await this.runWrite(id, async () => {
      const result = await this.api.distribute(id, dspIds);

      // Both arrays are reported: the server decides what was new, and another user may
      // have distributed to one of these since this page loaded.
      const parts: string[] = [];

      if (result.submitted.length > 0) {
        parts.push(`Submitted to ${listNames(result.submitted)}.`);
      }
      for (const already of result.alreadyDistributed) {
        parts.push(`Already on ${already.dspName} (${already.status}).`);
      }

      this.toasts.success(parts.join(' ') || 'Nothing to submit.');
    });
  }

  async setTrackStatus(id: string, status: TrackStatus, reason: string | null): Promise<void> {
    await this.runWrite(id, async () => {
      const result = await this.api.setTrackStatus(id, { status, reason });
      this.reportStatusChange(result.changed, `Track status set to ${result.status}.`, status);
    });
  }

  async setDistributionStatus(
    id: string,
    distributionId: string,
    status: DistributionStatus,
    reason: string | null,
  ): Promise<void> {
    await this.runWrite(id, async () => {
      const result = await this.api.setDistributionStatus(id, distributionId, { status, reason });
      this.reportStatusChange(result.changed, `Status set to ${result.status}.`, status);
    });
  }

  async saveMetadata(id: string, metadata: UpdateMetadataRequest): Promise<void> {
    await this.runWrite(id, async () => {
      await this.api.replaceMetadata(id, metadata);
      this.toasts.success('Metadata saved.');
    });
  }

  private async runWrite(id: string, write: () => Promise<void>): Promise<void> {
    this._saving.set(true);

    try {
      await write();
      await this.load(id);
    } finally {
      this._saving.set(false);
    }
  }

  /** `changed: false` means nothing was written and no audit entry was created. */
  private reportStatusChange(changed: boolean, success: string, requested: string): void {
    if (changed) {
      this.toasts.success(success);
    } else {
      this.toasts.info(`Already ${requested} — nothing to change.`);
    }
  }
}

function listNames(entries: readonly { dspName: string }[]): string {
  const names = entries.map((entry) => entry.dspName);

  return names.length <= 1
    ? (names[0] ?? '')
    : `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`;
}
