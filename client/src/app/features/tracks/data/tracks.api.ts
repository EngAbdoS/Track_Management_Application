import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { PagedResult, TrackDetailDto, TrackListDto, TrackQuery } from '../../../models/api.models';
import { API_BASE_URL } from '../../../core/http/api-base-url';

@Injectable({ providedIn: 'root' })
export class TracksApi {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);

  list(query: TrackQuery): Promise<PagedResult<TrackListDto>> {
    let params = new HttpParams()
      .set('page', String(query.page ?? 1))
      .set('pageSize', String(query.pageSize ?? 20));

    if (query.artistId) {
      params = params.set('artistId', query.artistId);
    }
    if (query.status) {
      params = params.set('status', query.status);
    }
    if (query.genre) {
      // Passed through exactly as typed: the API folds spellings itself, so
      // "شعبى" finds tracks tagged "شعبي" with no client-side resolution.
      params = params.set('genre', query.genre);
    }

    return firstValueFrom(
      this.http.get<PagedResult<TrackListDto>>(`${this.baseUrl}/api/tracks`, { params }),
    );
  }

  /** One call returns the track, its metadata, every distribution and both audit trails. */
  getById(id: string): Promise<TrackDetailDto> {
    return firstValueFrom(this.http.get<TrackDetailDto>(`${this.baseUrl}/api/tracks/${id}`));
  }
}
