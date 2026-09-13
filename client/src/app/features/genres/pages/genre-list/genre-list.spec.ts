import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { vi } from 'vitest';
import { AuthStore } from '../../../../core/auth/auth.store';
import { GenreDto, PagedResult } from '../../../../models/api.models';
import { GenreCreation, GenresApi } from '../../data/genres.api';
import { GenreList } from './genre-list';

function page(items: GenreDto[]): PagedResult<GenreDto> {
  return { items, page: 1, pageSize: 20, totalCount: items.length, totalPages: 1 };
}

describe('GenreList', () => {
  let created: string[];

  async function render() {
    created = [];

    const api: Pick<GenresApi, 'list' | 'create'> = {
      list: vi.fn(async () => page([{ id: 'g1', name: 'Pop' }])),
      create: vi.fn(async (name: string): Promise<GenreCreation> => {
        created.push(name);
        return { genre: { id: 'g2', name }, created: true };
      }),
    };

    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: GenresApi, useValue: api },
        { provide: AuthStore, useValue: { canWrite: () => true } },
      ],
    });

    const fixture = TestBed.createComponent(GenreList);
    fixture.componentRef.setInput('page', undefined);
    await fixture.whenStable();

    return fixture;
  }

  it('adds a genre when the button is pressed', async () => {
    const fixture = await render();
    const host = fixture.nativeElement as HTMLElement;

    const input = host.querySelector('.add input') as HTMLInputElement;
    input.value = 'Dabke';
    input.dispatchEvent(new Event('input'));
    await fixture.whenStable();

    (host.querySelector('.add button') as HTMLButtonElement).click();
    await fixture.whenStable();

    // Regression: the button is type="submit" inside a <form>. The template once bound
    // (ngSubmit), which is an output of NgForm and therefore never fires unless
    // FormsModule is imported — so the press fell through to a native form submission
    // and reloaded the page instead of adding anything.
    expect(created).toEqual(['Dabke']);
  });

  it('clears the box after a successful add', async () => {
    const fixture = await render();
    const host = fixture.nativeElement as HTMLElement;

    const input = host.querySelector('.add input') as HTMLInputElement;
    input.value = 'Dabke';
    input.dispatchEvent(new Event('input'));
    await fixture.whenStable();

    (host.querySelector('.add button') as HTMLButtonElement).click();
    await fixture.whenStable();

    expect((host.querySelector('.add input') as HTMLInputElement).value).toBe('');
  });

  it('does not submit an empty or whitespace-only name', async () => {
    const fixture = await render();
    const host = fixture.nativeElement as HTMLElement;

    const input = host.querySelector('.add input') as HTMLInputElement;
    input.value = '   ';
    input.dispatchEvent(new Event('input'));
    await fixture.whenStable();

    const button = host.querySelector('.add button') as HTMLButtonElement;
    expect(button.disabled).toBe(true);

    button.click();
    await fixture.whenStable();

    expect(created).toEqual([]);
  });

  it('hides the add box from a Viewer', async () => {
    created = [];
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        {
          provide: GenresApi,
          useValue: { list: vi.fn(async () => page([])), create: vi.fn() },
        },
        { provide: AuthStore, useValue: { canWrite: () => false } },
      ],
    });

    const fixture = TestBed.createComponent(GenreList);
    fixture.componentRef.setInput('page', undefined);
    await fixture.whenStable();

    expect((fixture.nativeElement as HTMLElement).querySelector('.add')).toBeNull();
  });
});
