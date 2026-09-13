import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { DspDto } from '../../../models/api.models';
import { API_BASE_URL } from '../../../core/http/api-base-url';

/** The DSP list is three rows that never change, so it is fetched once per session. */
@Injectable({ providedIn: 'root' })
export class DspsApi {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);

  private readonly _dsps = signal<DspDto[]>([]);
  private loaded = false;

  readonly dsps = this._dsps.asReadonly();

  async load(): Promise<void> {
    if (this.loaded) {
      return;
    }

    // Not paged — this endpoint returns a plain array.
    this._dsps.set(await firstValueFrom(this.http.get<DspDto[]>(`${this.baseUrl}/api/dsps`)));
    this.loaded = true;
  }
}
