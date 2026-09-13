import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { GenreDto, PagedResult } from '../../../models/api.models';
import { API_BASE_URL } from '../../../core/http/api-base-url';

/** pageSize is capped at 100 server-side. */
const PICKER_PAGE_SIZE = 100;

@Injectable({ providedIn: 'root' })
export class GenresApi {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);

  private readonly _options = signal<GenreDto[]>([]);
  private loaded = false;

  /** Alphabetical, for the genre picker. */
  readonly options = this._options.asReadonly();

  list(page = 1, pageSize = 20): Promise<PagedResult<GenreDto>> {
    const params = new HttpParams().set('page', String(page)).set('pageSize', String(pageSize));

    return firstValueFrom(
      this.http.get<PagedResult<GenreDto>>(`${this.baseUrl}/api/genres`, { params }),
    );
  }

  async loadOptions(force = false): Promise<void> {
    if (this.loaded && !force) {
      return;
    }

    const result = await this.list(1, PICKER_PAGE_SIZE);
    this._options.set(result.items);
    this.loaded = true;
  }
}
