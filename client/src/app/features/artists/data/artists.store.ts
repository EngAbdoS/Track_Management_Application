import { Injectable, computed, inject, signal } from '@angular/core';
import { ApiError, parseApiError } from '../../../core/http/api-error';
import { ArtistDto, PagedResult } from '../../../models/api.models';
import { ArtistsApi } from './artists.api';

const EMPTY_PAGE: PagedResult<ArtistDto> = {
  items: [],
  page: 1,
  pageSize: 20,
  totalCount: 0,
  totalPages: 0,
};

@Injectable()
export class ArtistsStore {
  private readonly api = inject(ArtistsApi);

  private readonly _result = signal<PagedResult<ArtistDto>>(EMPTY_PAGE);
  private readonly _loading = signal(false);
  private readonly _error = signal<ApiError | null>(null);

  readonly result = this._result.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();

  readonly artists = computed(() => this._result().items);
  readonly isEmpty = computed(
    () => !this._loading() && !this._error() && this._result().items.length === 0,
  );

  async load(page: number): Promise<void> {
    this._loading.set(true);
    this._error.set(null);

    try {
      this._result.set(await this.api.list(page));
    } catch (cause) {
      this._error.set(parseApiError(cause));
      this._result.set(EMPTY_PAGE);
    } finally {
      this._loading.set(false);
    }
  }
}
