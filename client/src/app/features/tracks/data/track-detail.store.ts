import { Injectable, computed, inject, signal } from '@angular/core';
import { ApiError, parseApiError } from '../../../core/http/api-error';
import { TrackDetailDto } from '../../../models/api.models';
import { isLiveSomewhere } from '../../../shared/ui/status/status-presentation';
import { TracksApi } from './tracks.api';

@Injectable()
export class TrackDetailStore {
  private readonly api = inject(TracksApi);

  private readonly _track = signal<TrackDetailDto | null>(null);
  private readonly _loading = signal(false);
  private readonly _error = signal<ApiError | null>(null);

  readonly track = this._track.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();

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
}
