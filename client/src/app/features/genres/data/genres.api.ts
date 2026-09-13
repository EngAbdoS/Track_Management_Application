import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { CreateGenreRequest, GenreDto, PagedResult } from '../../../models/api.models';
import { API_BASE_URL } from '../../../core/http/api-base-url';

/** pageSize is capped at 100 server-side. */
const PICKER_PAGE_SIZE = 100;

export interface GenreCreation {
  genre: GenreDto;
  /**
   * False when the API answered 200 rather than 201, meaning an equivalent genre already
   * existed. Duplicate detection folds spelling — alef maksura, hamza forms, diacritics,
   * tatweel, case and whitespace — so the returned name may differ from what was typed,
   * and it is the stored one that counts.
   */
  created: boolean;
}

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

  /**
   * 201 means created, 200 means an equivalent already existed — both are success, and
   * the body is a GenreDto either way. The status code is the only way to tell them
   * apart, hence observe: 'response'.
   */
  async create(name: string): Promise<GenreCreation> {
    const body: CreateGenreRequest = { name };

    const response = await firstValueFrom(
      this.http.post<GenreDto>(`${this.baseUrl}/api/genres`, body, { observe: 'response' }),
    );

    const genre = response.body!;
    this._options.update((current) =>
      current.some((option) => option.id === genre.id)
        ? current
        : [...current, genre].sort((a, b) => a.name.localeCompare(b.name)),
    );

    return { genre, created: response.status === 201 };
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
