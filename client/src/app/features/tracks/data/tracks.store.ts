import { Injectable, computed, inject, signal } from '@angular/core';
import { ApiError, parseApiError } from '../../../core/http/api-error';
import { PagedResult, TrackListDto, TrackQuery } from '../../../models/api.models';
import { TracksApi } from './tracks.api';

const EMPTY_PAGE: PagedResult<TrackListDto> = {
  items: [],
  page: 1,
  pageSize: 20,
  totalCount: 0,
  totalPages: 0,
};

/**
 * List state for the tracks page. Filters are not held here — they live in the URL and
 * arrive as arguments to load(), so the URL stays the single source of truth and the
 * back button, a refresh and a shared link all behave.
 */
@Injectable()
export class TracksStore {
  private readonly api = inject(TracksApi);

  private readonly _result = signal<PagedResult<TrackListDto>>(EMPTY_PAGE);
  private readonly _loading = signal(false);
  private readonly _error = signal<ApiError | null>(null);
  private requestSequence = 0;

  readonly result = this._result.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();

  readonly tracks = computed(() => this._result().items);
  readonly isEmpty = computed(
    () => !this._loading() && !this._error() && this._result().items.length === 0,
  );

  async load(query: TrackQuery): Promise<void> {
    // Typing in the genre filter can leave several requests in flight; only the newest
    // may write, or a slow earlier response overwrites a fresher one.
    const sequence = ++this.requestSequence;

    this._loading.set(true);
    this._error.set(null);

    try {
      const result = await this.api.list(query);

      if (sequence === this.requestSequence) {
        this._result.set(result);
      }
    } catch (cause) {
      if (sequence === this.requestSequence) {
        this._error.set(parseApiError(cause));
        this._result.set(EMPTY_PAGE);
      }
    } finally {
      if (sequence === this.requestSequence) {
        this._loading.set(false);
      }
    }
  }
}
