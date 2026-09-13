// Mirrors the API contract. Enums are string unions because the API serialises them
// as PascalCase strings, never numbers.

export type TrackStatus = 'Draft' | 'Submitted' | 'Distributed';
export type DistributionStatus = 'Pending' | 'Live' | 'Rejected' | 'Paused' | 'Blocked';
export type StatusChangeSource = 'Created' | 'DistributeAction' | 'ManualUpdate';
export type Role = 'Distributor' | 'Viewer';

export const TRACK_STATUSES: readonly TrackStatus[] = ['Draft', 'Submitted', 'Distributed'];
export const DISTRIBUTION_STATUSES: readonly DistributionStatus[] = [
  'Pending',
  'Live',
  'Rejected',
  'Paused',
  'Blocked',
];

/** Envelope returned by every paged endpoint. `pageSize` is clamped server-side, so read it back. */
export interface PagedResult<T> {
  items: T[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}

export interface ArtistDto {
  id: string;
  name: string;
  /** ISO 3166-1 alpha-2, stored uppercase. */
  country: string;
  email: string;
}

export interface GenreDto {
  id: string;
  name: string;
}

export interface DspDto {
  id: string;
  name: string;
}

export interface UserResponse {
  id: string;
  username: string;
  role: Role;
}

export interface AuthResponse {
  accessToken: string;
  /** ISO-8601 with offset. Drives the proactive refresh in phase C3. */
  accessTokenExpiresAt: string;
  refreshToken: string;
}

export interface StatusChangeDto {
  /** null only on the first entry. */
  oldStatus: string | null;
  newStatus: string;
  reason: string | null;
  source: StatusChangeSource;
  changedByUserId: string;
  changedByUsername: string;
  changedAt: string;
}

export interface TrackMetadataDto {
  durationSeconds: number | null;
  bpm: number | null;
  iswc: string | null;
  /** ISO 639-1, lowercase. */
  language: string | null;
  isExplicit: boolean;
  label: string | null;
  coverArtUrl: string | null;
  copyrightLine: string | null;
}

export interface TrackDistributionDto {
  id: string;
  dspId: string;
  dspName: string;
  submittedAt: string;
  status: DistributionStatus;
  statusHistory: StatusChangeDto[];
}

/** List row — carries artist and genre names, so the list needs no extra calls. */
export interface TrackListDto {
  id: string;
  title: string;
  isrc: string;
  /** Date only: "2024-03-15". */
  releaseDate: string;
  status: TrackStatus;
  artistId: string;
  artistName: string;
  genreId: string;
  genreName: string;
}

export interface TrackDetailDto extends TrackListDto {
  /** null when never set. */
  metadata: TrackMetadataDto | null;
  /** [] when never distributed. */
  distributions: TrackDistributionDto[];
  /** Always at least the creation entry. Both history arrays arrive oldest-first. */
  statusHistory: StatusChangeDto[];
}

export interface DistributedDspDto {
  dspId: string;
  dspName: string;
  status: DistributionStatus;
}

export interface DistributeTrackResult {
  trackId: string;
  trackStatus: TrackStatus;
  submitted: DistributedDspDto[];
  /** DSPs the track already sat with — not an error; show their current status. */
  alreadyDistributed: DistributedDspDto[];
}

/** Both status PATCHes answer this shape. `changed: false` means nothing was written. */
export interface StatusChangeResult<TStatus> {
  status: TStatus;
  changed: boolean;
}

export interface TrackStatusChangeResult extends StatusChangeResult<TrackStatus> {
  trackId: string;
}

export interface DistributionStatusChangeResult extends StatusChangeResult<DistributionStatus> {
  distributionId: string;
}

// Requests

export interface LoginRequest {
  username: string;
  password: string;
}

export interface RefreshRequest {
  refreshToken: string;
}

export interface SaveArtistRequest {
  name: string;
  email: string;
  country: string;
}

export interface CreateGenreRequest {
  name: string;
}

export interface CreateTrackRequest {
  title: string;
  artistId: string;
  genreId: string;
  isrc: string;
  releaseDate: string;
}

/** No artistId — a track cannot change artist, by design. */
export type UpdateTrackRequest = Omit<CreateTrackRequest, 'artistId'>;

/** A replace, not a patch: every omitted field is cleared server-side. */
export type UpdateMetadataRequest = TrackMetadataDto;

export interface DistributeRequest {
  dspIds: string[];
}

export interface ChangeStatusRequest<TStatus> {
  status: TStatus;
  /** Optional, max 1000 chars, stored on the audit entry. */
  reason?: string | null;
}

export interface TrackQuery {
  page?: number;
  pageSize?: number;
  artistId?: string | null;
  status?: TrackStatus | null;
  /** Accepts a genre id *or* a name in any spelling — pass raw user text through. */
  genre?: string | null;
}
