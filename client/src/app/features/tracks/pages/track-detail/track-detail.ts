import { ChangeDetectionStrategy, Component, computed, effect, inject, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthStore } from '../../../../core/auth/auth.store';
import { describeApiError, parseApiError } from '../../../../core/http/api-error';
import {
  DistributionStatus,
  TRACK_STATUSES,
  TrackDistributionDto,
  TrackMetadataDto,
  TrackStatus,
  UpdateMetadataRequest,
} from '../../../../models/api.models';
import { Button } from '../../../../shared/ui/button/button';
import { EmptyState } from '../../../../shared/ui/empty-state/empty-state';
import { Skeleton } from '../../../../shared/ui/skeleton/skeleton';
import { ALLOWED_DISTRIBUTION_TRANSITIONS } from '../../../../shared/ui/status/status-presentation';
import { StatusPill } from '../../../../shared/ui/status/status-pill';
import { DspsApi } from '../../../dsps/data/dsps.api';
import { TrackDetailStore } from '../../data/track-detail.store';
import { DistributeDialog } from '../../ui/distribute-dialog/distribute-dialog';
import { DistributionsTable } from '../../ui/distributions-table/distributions-table';
import { MetadataForm } from '../../ui/metadata-form/metadata-form';
import { StatusChangeDialog, StatusChangeSubmission } from '../../ui/status-change-dialog/status-change-dialog';
import { StatusTimeline } from '../../ui/status-timeline/status-timeline';

type OpenDialog = 'none' | 'distribute' | 'trackStatus' | 'distributionStatus' | 'metadata';

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
    DistributeDialog,
    StatusChangeDialog,
    MetadataForm,
  ],
})
export class TrackDetail {
  private readonly dspsApi = inject(DspsApi);

  protected readonly store = inject(TrackDetailStore);
  protected readonly auth = inject(AuthStore);
  protected readonly dsps = this.dspsApi.dsps;

  /** Bound from the :id route param by withComponentInputBinding(). */
  readonly id = input.required<string>();

  protected readonly dialog = signal<OpenDialog>('none');
  protected readonly dialogError = signal<string | null>(null);
  protected readonly editingDistribution = signal<TrackDistributionDto | null>(null);

  protected readonly trackStatuses: readonly string[] = TRACK_STATUSES;

  protected readonly errorMessage = computed(() => {
    const error = this.store.error();
    return error ? describeApiError(error) : null;
  });

  /** Only the transitions the documented lifecycle allows from where this DSP is now. */
  protected readonly distributionOptions = computed<readonly string[]>(() => {
    const current = this.editingDistribution();
    return current ? ALLOWED_DISTRIBUTION_TRANSITIONS[current.status] : [];
  });

  protected readonly metadataRows = computed(() => {
    const metadata = this.store.track()?.metadata;

    return metadata ? metadataFields(metadata).filter((row) => row.value !== null) : [];
  });

  constructor() {
    void this.dspsApi.load();

    effect(() => void this.store.load(this.id()));
  }

  protected openDistributionStatus(distribution: TrackDistributionDto): void {
    this.editingDistribution.set(distribution);
    this.open('distributionStatus');
  }

  protected open(dialog: OpenDialog): void {
    this.dialogError.set(null);
    this.dialog.set(dialog);
  }

  protected close(): void {
    this.dialog.set('none');
    this.dialogError.set(null);
  }

  protected async distribute(dspIds: string[]): Promise<void> {
    await this.runFromDialog(() => this.store.distribute(this.id(), dspIds));
  }

  protected async changeTrackStatus(submission: StatusChangeSubmission): Promise<void> {
    await this.runFromDialog(() =>
      this.store.setTrackStatus(this.id(), submission.status as TrackStatus, submission.reason),
    );
  }

  protected async changeDistributionStatus(submission: StatusChangeSubmission): Promise<void> {
    const distribution = this.editingDistribution();

    if (!distribution) {
      return;
    }

    await this.runFromDialog(() =>
      this.store.setDistributionStatus(
        this.id(),
        distribution.id,
        submission.status as DistributionStatus,
        submission.reason,
      ),
    );
  }

  protected async saveMetadata(metadata: UpdateMetadataRequest): Promise<void> {
    await this.runFromDialog(() => this.store.saveMetadata(this.id(), metadata));
  }

  /** Keeps a failed write's dialog open, with the reason, rather than losing what was typed. */
  private async runFromDialog(write: () => Promise<void>): Promise<void> {
    this.dialogError.set(null);

    try {
      await write();
      this.close();
    } catch (cause) {
      this.dialogError.set(describeApiError(parseApiError(cause)));
    }
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
