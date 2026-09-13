import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { API_BASE_URL } from '../../../core/http/api-base-url';
import { GenresApi } from './genres.api';

const API = 'http://api.test';

describe('GenresApi.create', () => {
  let api: GenresApi;
  let backend: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: API_BASE_URL, useValue: API },
      ],
    });

    api = TestBed.inject(GenresApi);
    backend = TestBed.inject(HttpTestingController);
  });

  afterEach(() => backend.verify());

  it('reports 201 as a genuine creation', async () => {
    const result = api.create('Afrobeats');

    backend
      .expectOne(`${API}/api/genres`)
      .flush({ id: 'g1', name: 'Afrobeats' }, { status: 201, statusText: 'Created' });

    expect(await result).toEqual({ genre: { id: 'g1', name: 'Afrobeats' }, created: true });
  });

  it('reports 200 as a match against an existing genre', async () => {
    const result = api.create('شعبى');

    // The API folds spelling variants, so the stored name can differ from the typed one.
    // Both codes are success; only the status tells them apart.
    backend
      .expectOne(`${API}/api/genres`)
      .flush({ id: 'g2', name: 'شعبي' }, { status: 200, statusText: 'OK' });

    expect(await result).toEqual({ genre: { id: 'g2', name: 'شعبي' }, created: false });
  });

  it('adds a created genre to the cached options, alphabetically', async () => {
    void api.loadOptions();
    backend
      .expectOne((request) => request.url === `${API}/api/genres`)
      .flush({ items: [{ id: 'g1', name: 'Pop' }], page: 1, pageSize: 100, totalCount: 1, totalPages: 1 });

    const created = api.create('Afrobeats');
    backend
      .expectOne(`${API}/api/genres`)
      .flush({ id: 'g3', name: 'Afrobeats' }, { status: 201, statusText: 'Created' });
    await created;

    expect(api.options().map((genre) => genre.name)).toEqual(['Afrobeats', 'Pop']);
  });

  it('does not duplicate a genre that folded into one already cached', async () => {
    void api.loadOptions();
    backend
      .expectOne((request) => request.url === `${API}/api/genres`)
      .flush({ items: [{ id: 'g2', name: 'شعبي' }], page: 1, pageSize: 100, totalCount: 1, totalPages: 1 });

    const matched = api.create('شعبى');
    backend.expectOne(`${API}/api/genres`).flush({ id: 'g2', name: 'شعبي' }, { status: 200, statusText: 'OK' });
    await matched;

    expect(api.options()).toHaveLength(1);
  });
});
