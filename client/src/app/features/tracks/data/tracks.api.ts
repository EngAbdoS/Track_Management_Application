import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import {
  ChangeStatusRequest,
  CreateTrackRequest,
  DistributeRequest,
  DistributeTrackResult,
  DistributionStatus,
  DistributionStatusChangeResult,
  PagedResult,
  TrackDetailDto,
  TrackListDto,
  TrackMetadataDto,
  TrackQuery,
  TrackStatus,
  TrackStatusChangeResult,
  UpdateMetadataRequest,
  UpdateTrackRequest,
} from '../../../models/api.models';
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

  /** New tracks always start as Draft; the status cannot be set on creation. */
  create(request: CreateTrackRequest): Promise<TrackDetailDto> {
    return firstValueFrom(this.http.post<TrackDetailDto>(`${this.baseUrl}/api/tracks`, request));
  }

  /** No artistId: moving a track between artists is a catalogue transfer, not an edit. */
  update(id: string, request: UpdateTrackRequest): Promise<TrackDetailDto> {
    return firstValueFrom(
      this.http.put<TrackDetailDto>(`${this.baseUrl}/api/tracks/${id}`, request),
    );
  }

  /**
   * A replace, not a patch — any field omitted here is cleared server-side, so callers
   * must send the complete object including the fields they did not touch.
   */
  replaceMetadata(id: string, request: UpdateMetadataRequest): Promise<TrackMetadataDto> {
    return firstValueFrom(
      this.http.put<TrackMetadataDto>(`${this.baseUrl}/api/tracks/${id}/metadata`, request),
    );
  }

  /**
   * Idempotent per DSP: sending one the track already sits with is not an error, it comes
   * back under alreadyDistributed with its current status.
   */
  distribute(id: string, dspIds: string[]): Promise<DistributeTrackResult> {
    const body: DistributeRequest = { dspIds };

    return firstValueFrom(
      this.http.post<DistributeTrackResult>(`${this.baseUrl}/api/tracks/${id}/distribute`, body),
    );
  }

  setTrackStatus(
    id: string,
    request: ChangeStatusRequest<TrackStatus>,
  ): Promise<TrackStatusChangeResult> {
    return firstValueFrom(
      this.http.patch<TrackStatusChangeResult>(`${this.baseUrl}/api/tracks/${id}/status`, request),
    );
  }

  setDistributionStatus(
    trackId: string,
    distributionId: string,
    request: ChangeStatusRequest<DistributionStatus>,
  ): Promise<DistributionStatusChangeResult> {
    return firstValueFrom(
      this.http.patch<DistributionStatusChangeResult>(
        `${this.baseUrl}/api/tracks/${trackId}/distributions/${distributionId}/status`,
        request,
      ),
    );
  }
}
