import { ChangeDetectionStrategy, Component, computed, effect, inject, input } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthStore } from '../../../../core/auth/auth.store';
import { describeApiError } from '../../../../core/http/api-error';
import { Button } from '../../../../shared/ui/button/button';
import { EmptyState } from '../../../../shared/ui/empty-state/empty-state';
import { Pagination } from '../../../../shared/ui/pagination/pagination';
import { Skeleton } from '../../../../shared/ui/skeleton/skeleton';
import { ArtistsStore } from '../../data/artists.store';
import { countryName } from '../../data/countries';

@Component({
  selector: 'app-artist-list',
  imports: [RouterLink, Button, Pagination, Skeleton, EmptyState],
  providers: [ArtistsStore],
  templateUrl: './artist-list.html',
  styleUrl: './artist-list.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ArtistList {
  private readonly router = inject(Router);

  protected readonly store = inject(ArtistsStore);
  protected readonly auth = inject(AuthStore);

  readonly page = input<string | undefined>();

  protected readonly currentPage = computed(() => {
    const parsed = Number(this.page());
    return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : 1;
  });

  protected readonly errorMessage = computed(() => {
    const error = this.store.error();
    return error ? describeApiError(error) : null;
  });

  constructor() {
    effect(() => void this.store.load(this.currentPage()));
  }

  /** The API stores alpha-2; "EG" alone tells a reader less than "Egypt (EG)". */
  protected country(code: string): string {
    return countryName(code);
  }

  protected goToPage(page: number): void {
    void this.router.navigate([], {
      queryParams: { page: page === 1 ? null : page },
      queryParamsHandling: 'merge',
    });
  }
}
