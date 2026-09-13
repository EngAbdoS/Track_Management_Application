import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { ArtistDto, PagedResult, SaveArtistRequest } from '../../../models/api.models';
import { API_BASE_URL } from '../../../core/http/api-base-url';

/** pageSize is capped at 100 server-side, so asking for more is pointless. */
const PICKER_PAGE_SIZE = 100;

@Injectable({ providedIn: 'root' })
export class ArtistsApi {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);

  private readonly _pickerOptions = signal<ArtistDto[]>([]);
  private pickerLoaded = false;

  /** Artists for filter and picker dropdowns. Fetched once, then served from memory. */
  readonly pickerOptions = this._pickerOptions.asReadonly();

  list(page = 1, pageSize = 20): Promise<PagedResult<ArtistDto>> {
    const params = new HttpParams().set('page', String(page)).set('pageSize', String(pageSize));

    return firstValueFrom(
      this.http.get<PagedResult<ArtistDto>>(`${this.baseUrl}/api/artists`, { params }),
    );
  }

  getById(id: string): Promise<ArtistDto> {
    return firstValueFrom(this.http.get<ArtistDto>(`${this.baseUrl}/api/artists/${id}`));
  }

  /** Email must be unique; a duplicate answers 409. Country is stored uppercase. */
  create(request: SaveArtistRequest): Promise<ArtistDto> {
    return firstValueFrom(this.http.post<ArtistDto>(`${this.baseUrl}/api/artists`, request));
  }

  update(id: string, request: SaveArtistRequest): Promise<ArtistDto> {
    return firstValueFrom(this.http.put<ArtistDto>(`${this.baseUrl}/api/artists/${id}`, request));
  }

  async loadPickerOptions(force = false): Promise<void> {
    if (this.pickerLoaded && !force) {
      return;
    }

    const result = await this.list(1, PICKER_PAGE_SIZE);
    this._pickerOptions.set(result.items);
    this.pickerLoaded = true;
  }
}
