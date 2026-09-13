import { ChangeDetectionStrategy, Component, computed, effect, inject, input } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthStore } from '../../../../core/auth/auth.store';
import { describeApiError } from '../../../../core/http/api-error';
import { TrackStatus } from '../../../../models/api.models';
import { Button } from '../../../../shared/ui/button/button';
import { EmptyState } from '../../../../shared/ui/empty-state/empty-state';
import { Pagination } from '../../../../shared/ui/pagination/pagination';
import { Skeleton } from '../../../../shared/ui/skeleton/skeleton';
import { StatusPill } from '../../../../shared/ui/status/status-pill';
import { ArtistsApi } from '../../../artists/data/artists.api';
import { TracksStore } from '../../data/tracks.store';
import { TrackFilterValues, TrackFilters } from '../../ui/track-filters/track-filters';

const PAGE_SIZE = 20;

@Component({
  selector: 'app-track-list',
  imports: [RouterLink, TrackFilters, StatusPill, Pagination, Skeleton, EmptyState, Button],
  providers: [TracksStore],
  templateUrl: './track-list.html',
  styleUrl: './track-list.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TrackList {
  private readonly router = inject(Router);
  private readonly artistsApi = inject(ArtistsApi);

  protected readonly store = inject(TracksStore);
  protected readonly auth = inject(AuthStore);
  protected readonly artists = this.artistsApi.pickerOptions;

  // Filters and paging come from the query string, bound by withComponentInputBinding().
  // The URL is the state: back, refresh and link-sharing all work without extra code.
  readonly status = input<TrackStatus | undefined>();
  readonly artistId = input<string | undefined>();
  readonly genre = input<string | undefined>();
  readonly page = input<string | undefined>();

  protected readonly currentPage = computed(() => {
    const parsed = Number(this.page());
    return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : 1;
  });

  protected readonly errorMessage = computed(() => {
    const error = this.store.error();
    return error ? describeApiError(error) : null;
  });

  protected readonly hasFilters = computed(() => !!(this.status() || this.artistId() || this.genre()));

  constructor() {
    void this.artistsApi.loadPickerOptions();

    effect(() => {
      void this.store.load({
        page: this.currentPage(),
        pageSize: PAGE_SIZE,
        status: this.status() ?? null,
        artistId: this.artistId() ?? null,
        genre: this.genre() ?? null,
      });
    });
  }

  protected applyFilters(change: Partial<TrackFilterValues>): void {
    // Any filter change returns to page 1 — page 4 of the old result set means nothing
    // against the new one.
    void this.router.navigate([], {
      queryParams: { ...change, page: null },
      queryParamsHandling: 'merge',
    });
  }

  protected goToPage(page: number): void {
    void this.router.navigate([], {
      queryParams: { page: page === 1 ? null : page },
      queryParamsHandling: 'merge',
    });
  }

  protected openTrack(id: string): void {
    void this.router.navigate(['/tracks', id]);
  }
}
