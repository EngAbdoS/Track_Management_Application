import { ChangeDetectionStrategy, Component, inject, input, output, signal } from '@angular/core';
import { describeApiError, parseApiError } from '../../../../core/http/api-error';
import { GenreDto } from '../../../../models/api.models';
import { Button } from '../../../../shared/ui/button/button';
import { Field } from '../../../../shared/ui/field/field';
import { GenresApi } from '../../data/genres.api';

const ADD_NEW = '__add_new__';

/**
 * Picks an existing genre or adds one. Adding is where the API surprises you: POST
 * /api/genres answers 201 for a new genre and **200** for one that already existed under
 * a different spelling, returning the stored genre either way. The user's spelling is
 * not saved, so when that happens the picker says so rather than silently selecting
 * something they did not type.
 */
@Component({
  selector: 'app-genre-picker',
  imports: [Field, Button],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (adding()) {
      <app-field
        label="New genre"
        [error]="error()"
        hint="Spelling variants are folded — أغاني and اغاني are the same genre."
      >
        <div class="row">
          <input
            type="text"
            [value]="draft()"
            [disabled]="pending()"
            placeholder="e.g. Shaabi or شعبي"
            (input)="draft.set($any($event.target).value)"
            (keydown.enter)="$event.preventDefault(); add()"
          />
          <button appButton type="button" [disabled]="pending() || !draft().trim()" (click)="add()">
            {{ pending() ? 'Adding…' : 'Add' }}
          </button>
          <button appButton variant="ghost" type="button" [disabled]="pending()" (click)="cancelAdd()">
            Cancel
          </button>
        </div>
      </app-field>
    } @else {
      <app-field label="Genre" [error]="fieldError()" [hint]="matchNote()">
        <select [disabled]="disabled()" (change)="onSelect($event)">
          <option value="" [selected]="!value()">Choose a genre</option>
          @for (genre of genres(); track genre.id) {
            <option [value]="genre.id" [selected]="genre.id === value()">{{ genre.name }}</option>
          }
          <option [value]="ADD_NEW">＋ Add a new genre…</option>
        </select>
      </app-field>
    }
  `,
  styles: `
    .row {
      display: flex;
      gap: var(--space-2);
    }

    .row input {
      flex: 1;
    }
  `,
})
export class GenrePicker {
  private readonly api = inject(GenresApi);

  readonly genres = input.required<readonly GenreDto[]>();
  readonly value = input<string | null>(null);
  readonly disabled = input(false);
  readonly fieldError = input<string | null>(null);

  readonly selected = output<string>();

  protected readonly ADD_NEW = ADD_NEW;
  protected readonly adding = signal(false);
  protected readonly pending = signal(false);
  protected readonly draft = signal('');
  protected readonly error = signal<string | null>(null);
  protected readonly matchNote = signal<string | null>(null);

  protected onSelect(event: Event): void {
    const value = (event.target as HTMLSelectElement).value;

    if (value === ADD_NEW) {
      this.adding.set(true);
      this.error.set(null);
      this.matchNote.set(null);
      return;
    }

    this.matchNote.set(null);
    this.selected.emit(value);
  }

  protected cancelAdd(): void {
    this.adding.set(false);
    this.draft.set('');
    this.error.set(null);
  }

  protected async add(): Promise<void> {
    const name = this.draft().trim();

    if (!name || this.pending()) {
      return;
    }

    this.pending.set(true);
    this.error.set(null);

    try {
      const { genre, created } = await this.api.create(name);

      // On a 200 the typed spelling was discarded in favour of the stored one. Saying
      // which genre was matched is the difference between a helpful fold and a value
      // the user did not choose appearing in the field.
      this.matchNote.set(
        created ? `Added “${genre.name}”.` : `Matched to the existing genre “${genre.name}”.`,
      );

      this.selected.emit(genre.id);
      this.adding.set(false);
      this.draft.set('');
    } catch (cause) {
      this.error.set(describeApiError(parseApiError(cause)));
    } finally {
      this.pending.set(false);
    }
  }
}
