import { ChangeDetectionStrategy, Component, computed, effect, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthStore } from '../../../../core/auth/auth.store';
import { describeApiError } from '../../../../core/http/api-error';
import { TrackMetadataDto } from '../../../../models/api.models';
import { Button } from '../../../../shared/ui/button/button';
import { EmptyState } from '../../../../shared/ui/empty-state/empty-state';
import { Skeleton } from '../../../../shared/ui/skeleton/skeleton';
import { StatusPill } from '../../../../shared/ui/status/status-pill';
import { TrackDetailStore } from '../../data/track-detail.store';
import { DistributionsTable } from '../../ui/distributions-table/distributions-table';
import { StatusTimeline } from '../../ui/status-timeline/status-timeline';

@Component({
  selector: 'app-track-detail',
  providers: [TrackDetailStore],
  templateUrl: './track-detail.html',
  styleUrl: './track-detail.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterLink,
    Button,
    Skeleton,
    EmptyState,
    StatusPill,
    DistributionsTable,
    StatusTimeline,
  ],
})
export class TrackDetail {
  protected readonly store = inject(TrackDetailStore);
  protected readonly auth = inject(AuthStore);

  /** Bound from the :id route param by withComponentInputBinding(). */
  readonly id = input.required<string>();

  protected readonly errorMessage = computed(() => {
    const error = this.store.error();
    return error ? describeApiError(error) : null;
  });

  /** Metadata fields worth showing, in display order, with the empty ones dropped. */
  protected readonly metadataRows = computed(() => {
    const metadata = this.store.track()?.metadata;

    if (!metadata) {
      return [];
    }

    return metadataFields(metadata).filter((row) => row.value !== null);
  });

  constructor() {
    effect(() => void this.store.load(this.id()));
  }
}

interface MetadataRow {
  label: string;
  value: string | null;
  mono?: boolean;
}

function metadataFields(metadata: TrackMetadataDto): MetadataRow[] {
  return [
    { label: 'Duration', value: formatDuration(metadata.durationSeconds) },
    { label: 'BPM', value: metadata.bpm === null ? null : String(metadata.bpm) },
    { label: 'ISWC', value: metadata.iswc, mono: true },
    { label: 'Language', value: metadata.language },
    { label: 'Explicit', value: metadata.isExplicit ? 'Yes' : 'No' },
    { label: 'Label', value: metadata.label },
    { label: 'Copyright', value: metadata.copyrightLine },
    { label: 'Cover art', value: metadata.coverArtUrl },
  ];
}

function formatDuration(seconds: number | null): string | null {
  if (seconds === null) {
    return null;
  }

  const minutes = Math.floor(seconds / 60);
  return `${minutes}:${String(seconds % 60).padStart(2, '0')}`;
}
