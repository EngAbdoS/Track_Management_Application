import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Pagination } from './pagination';

describe('Pagination', () => {
  let fixture: ComponentFixture<Pagination>;

  async function render(inputs: {
    page: number;
    pageSize: number;
    totalCount: number;
    totalPages: number;
  }) {
    fixture = TestBed.createComponent(Pagination);
    fixture.componentRef.setInput('page', inputs.page);
    fixture.componentRef.setInput('pageSize', inputs.pageSize);
    fixture.componentRef.setInput('totalCount', inputs.totalCount);
    fixture.componentRef.setInput('totalPages', inputs.totalPages);
    await fixture.whenStable();

    return (fixture.nativeElement as HTMLElement).textContent?.replace(/\s+/g, ' ').trim() ?? '';
  }

  function buttons() {
    return Array.from(
      (fixture.nativeElement as HTMLElement).querySelectorAll('button'),
    ) as HTMLButtonElement[];
  }

  it('counts from the response envelope, not the requested page size', async () => {
    // pageSize is clamped server-side, so the envelope's value is the only true one.
    const text = await render({ page: 1, pageSize: 20, totalCount: 43, totalPages: 3 });

    expect(text).toContain('1–20 of 43');
    expect(text).toContain('Page 1 of 3');
  });

  it('does not run past the total on a partial last page', async () => {
    const text = await render({ page: 3, pageSize: 20, totalCount: 43, totalPages: 3 });

    expect(text).toContain('41–43 of 43');
  });

  it('says so plainly when there is nothing to page through', async () => {
    const text = await render({ page: 1, pageSize: 20, totalCount: 0, totalPages: 0 });

    expect(text).toContain('No results');
    // Zero pages would otherwise render "Page 1 of 0".
    expect(text).toContain('Page 1 of 1');
    expect(buttons().every((button) => button.disabled)).toBe(true);
  });

  it('disables the edges of the range', async () => {
    await render({ page: 1, pageSize: 20, totalCount: 43, totalPages: 3 });
    expect(buttons()[0].disabled).toBe(true);
    expect(buttons()[1].disabled).toBe(false);

    await render({ page: 3, pageSize: 20, totalCount: 43, totalPages: 3 });
    expect(buttons()[0].disabled).toBe(false);
    expect(buttons()[1].disabled).toBe(true);
  });

  it('emits the page to move to', async () => {
    await render({ page: 2, pageSize: 20, totalCount: 43, totalPages: 3 });
    const requested: number[] = [];
    fixture.componentInstance.goTo.subscribe((page) => requested.push(page));

    buttons()[0].click();
    buttons()[1].click();

    expect(requested).toEqual([1, 3]);
  });
});
