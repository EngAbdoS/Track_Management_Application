import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TrackMetadataDto, UpdateMetadataRequest } from '../../../../models/api.models';
import { MetadataForm } from './metadata-form';

const EXISTING: TrackMetadataDto = {
  durationSeconds: 243,
  bpm: 128,
  iswc: 'T-123456789-0',
  language: 'ar',
  isExplicit: true,
  label: 'Rotana',
  coverArtUrl: 'https://cdn.example.com/art.jpg',
  copyrightLine: '℗ 2026 Rotana',
};

describe('MetadataForm', () => {
  let fixture: ComponentFixture<MetadataForm>;
  let saved: UpdateMetadataRequest[];

  beforeAll(() => {
    // jsdom renders <dialog> but implements neither showModal() nor close(). The modal
    // behaviour is the browser's to provide and is verified there; here the element only
    // needs to open so the form inside it can be exercised.
    HTMLDialogElement.prototype.showModal ??= function (this: HTMLDialogElement) {
      this.open = true;
    };
    HTMLDialogElement.prototype.close ??= function (this: HTMLDialogElement) {
      this.open = false;
    };
  });

  async function open(metadata: TrackMetadataDto | null) {
    fixture = TestBed.createComponent(MetadataForm);
    fixture.componentRef.setInput('metadata', metadata);
    fixture.componentRef.setInput('open', true);
    saved = [];
    fixture.componentInstance.saved.subscribe((value) => saved.push(value));
    await fixture.whenStable();
  }

  function save() {
    const button = [...(fixture.nativeElement as HTMLElement).querySelectorAll('button')].find(
      (candidate) => candidate.textContent?.includes('Save metadata'),
    );
    button?.click();
  }

  it('sends every field back, including untouched ones', async () => {
    await open(EXISTING);
    save();

    // PUT /metadata is a replace: anything omitted is cleared server-side. Submitting an
    // untouched form must therefore round-trip the whole object, not an empty patch.
    expect(saved).toEqual([EXISTING]);
  });

  it('sends a cleared text field as null rather than an empty string', async () => {
    await open(EXISTING);
    fixture.componentInstance['form'].patchValue({ label: '', iswc: '   ' });
    save();

    expect(saved[0].label).toBeNull();
    expect(saved[0].iswc).toBeNull();
    // Clearing one field must not disturb the others.
    expect(saved[0].bpm).toBe(128);
    expect(saved[0].copyrightLine).toBe('℗ 2026 Rotana');
  });

  it('lowercases the language code, as the API stores it', async () => {
    await open(EXISTING);
    fixture.componentInstance['form'].patchValue({ language: 'AR' });
    save();

    expect(saved[0].language).toBe('ar');
  });

  it('starts empty for a track that has no metadata yet', async () => {
    await open(null);
    save();

    expect(saved).toEqual([
      {
        durationSeconds: null,
        bpm: null,
        iswc: null,
        language: null,
        isExplicit: false,
        label: null,
        coverArtUrl: null,
        copyrightLine: null,
      },
    ]);
  });
});
