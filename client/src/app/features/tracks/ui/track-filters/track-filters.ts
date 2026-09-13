import { ChangeDetectionStrategy, Component, effect, input, output, signal } from '@angular/core';
import { ArtistDto, TRACK_STATUSES, TrackStatus } from '../../../../models/api.models';
import { Button } from '../../../../shared/ui/button/button';
import { Field } from '../../../../shared/ui/field/field';

export interface TrackFilterValues {
  status: TrackStatus | null;
  artistId: string | null;
  genre: string | null;
}

const GENRE_DEBOUNCE_MS = 300;

@Component({
  selector: 'app-track-filters',
  imports: [Field, Button],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="filters">
      <!-- Selectedness is bound on the options, not as [value] on the <select>. The
           select's value is applied before @for has created the options, so a
           deep-linked ?status=Draft would leave the control reading "All statuses". -->
      <app-field label="Status">
        <select (change)="onStatus($event)">
          <option value="" [selected]="!status()">All statuses</option>
          @for (option of statuses; track option) {
            <option [value]="option" [selected]="option === status()">{{ option }}</option>
          }
        </select>
      </app-field>

      <app-field label="Artist">
        <select (change)="onArtist($event)">
          <option value="" [selected]="!artistId()">All artists</option>
          @for (artist of artists(); track artist.id) {
            <option [value]="artist.id" [selected]="artist.id === artistId()">{{ artist.name }}</option>
          }
        </select>
      </app-field>

      <app-field label="Genre" hint="Any spelling — the API folds variants.">
        <input
          type="search"
          [value]="genreText()"
          (input)="onGenreTyped($event)"
          placeholder="e.g. Pop or شعبي"
        />
      </app-field>

      @if (hasAnyFilter()) {
        <button appButton type="button" class="clear" (click)="clearAll()">Clear filters</button>
      }
    </div>
  `,
  styles: `
    .filters {
      display: flex;
      /* Start, not end: the genre field carries a hint under its input, and aligning on
         the bottom edge would push its control up out of line with the other two. Every
         label is one line high, so aligning at the top puts all three controls on the
         same line and lets the hint hang below. */
      align-items: flex-start;
      gap: var(--space-4);
      flex-wrap: wrap;
      margin-block-end: var(--space-4);
    }

    app-field {
      min-width: 190px;
    }

    /* Sits on the control line rather than the label line above it. */
    .clear {
      margin-block-start: calc(var(--text-base) * var(--leading-normal) + var(--space-2));
    }
  `,
})
export class TrackFilters {
  readonly status = input<TrackStatus | null>(null);
  readonly artistId = input<string | null>(null);
  readonly genre = input<string | null>(null);
  readonly artists = input<readonly ArtistDto[]>([]);

  readonly changed = output<Partial<TrackFilterValues>>();

  protected readonly statuses = TRACK_STATUSES;
  /** Local mirror so the box stays responsive while the debounced URL update waits. */
  protected readonly genreText = signal('');

  private debounce: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    effect(() => this.genreText.set(this.genre() ?? ''));
  }

  protected hasAnyFilter(): boolean {
    return !!(this.status() || this.artistId() || this.genre());
  }

  protected onStatus(event: Event): void {
    const value = (event.target as HTMLSelectElement).value;
    this.changed.emit({ status: (value || null) as TrackStatus | null });
  }

  protected onArtist(event: Event): void {
    const value = (event.target as HTMLSelectElement).value;
    this.changed.emit({ artistId: value || null });
  }

  protected onGenreTyped(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.genreText.set(value);

    if (this.debounce !== null) {
      clearTimeout(this.debounce);
    }

    // Each keystroke would otherwise be a history entry and a request.
    this.debounce = setTimeout(
      () => this.changed.emit({ genre: value.trim() || null }),
      GENRE_DEBOUNCE_MS,
    );
  }

  protected clearAll(): void {
    this.genreText.set('');
    this.changed.emit({ status: null, artistId: null, genre: null });
  }
}
