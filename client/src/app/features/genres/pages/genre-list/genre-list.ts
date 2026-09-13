import { ChangeDetectionStrategy, Component, computed, effect, inject, input, signal } from '@angular/core';
import { Router } from '@angular/router';
import { AuthStore } from '../../../../core/auth/auth.store';
import { ApiError, describeApiError, parseApiError } from '../../../../core/http/api-error';
import { ToastStore } from '../../../../core/notifications/toast.store';
import { GenreDto, PagedResult } from '../../../../models/api.models';
import { Button } from '../../../../shared/ui/button/button';
import { EmptyState } from '../../../../shared/ui/empty-state/empty-state';
import { Field } from '../../../../shared/ui/field/field';
import { Pagination } from '../../../../shared/ui/pagination/pagination';
import { Skeleton } from '../../../../shared/ui/skeleton/skeleton';
import { GenresApi } from '../../data/genres.api';

const EMPTY_PAGE: PagedResult<GenreDto> = {
  items: [],
  page: 1,
  pageSize: 20,
  totalCount: 0,
  totalPages: 0,
};

// Small enough to hold its state in the component; tracks and artists earn a store
// because their filters and write flows have more to coordinate.
@Component({
  selector: 'app-genre-list',
  imports: [Field, Button, Pagination, Skeleton, EmptyState],
  templateUrl: './genre-list.html',
  styleUrl: './genre-list.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GenreList {
  private readonly api = inject(GenresApi);
  private readonly router = inject(Router);
  private readonly toasts = inject(ToastStore);

  protected readonly auth = inject(AuthStore);

  readonly page = input<string | undefined>();

  protected readonly result = signal<PagedResult<GenreDto>>(EMPTY_PAGE);
  protected readonly loading = signal(false);
  protected readonly error = signal<ApiError | null>(null);
  protected readonly draft = signal('');
  protected readonly adding = signal(false);
  protected readonly addError = signal<string | null>(null);

  protected readonly currentPage = computed(() => {
    const parsed = Number(this.page());
    return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : 1;
  });

  protected readonly errorMessage = computed(() => {
    const failure = this.error();
    return failure ? describeApiError(failure) : null;
  });

  constructor() {
    effect(() => void this.load(this.currentPage()));
  }

  protected async load(page: number): Promise<void> {
    this.loading.set(true);
    this.error.set(null);

    try {
      this.result.set(await this.api.list(page));
    } catch (cause) {
      this.error.set(parseApiError(cause));
      this.result.set(EMPTY_PAGE);
    } finally {
      this.loading.set(false);
    }
  }

  protected async add(): Promise<void> {
    const name = this.draft().trim();

    if (!name || this.adding()) {
      return;
    }

    this.adding.set(true);
    this.addError.set(null);

    try {
      const { genre, created } = await this.api.create(name);

      // 200 means an equivalent genre already existed under a different spelling, and
      // what was typed was not stored. Reporting which genre it folded into is the
      // whole point of distinguishing the two status codes.
      this.toasts.success(
        created ? `Added “${genre.name}”.` : `“${name}” already exists as “${genre.name}”.`,
      );

      this.draft.set('');
      await this.load(this.currentPage());
    } catch (cause) {
      this.addError.set(describeApiError(parseApiError(cause)));
    } finally {
      this.adding.set(false);
    }
  }

  protected goToPage(page: number): void {
    void this.router.navigate([], {
      queryParams: { page: page === 1 ? null : page },
      queryParamsHandling: 'merge',
    });
  }
}
