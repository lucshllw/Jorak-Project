export type PublishStatus = 'draft' | 'published' | 'archived';
export type Artist = { id: string; name: string; slug: string };
export type Segment = {
  id: string; name: string; start: number | null; end: number | null; clipUrl: string | null;
  kind: 'edit' | 'trailer'; order: number;
  previewUrl?: string | null; previewStart?: number | null;
  posterUrl?: string | null; videoWidth?: number; videoHeight?: number;
  mobileClipUrl?: string | null;
  timeline?: 'original' | 'showcase';
  rangeStatus?: 'explicit' | 'chapter-boundary' | 'inferred' | 'pending';
  sourceUrl?: string; evidence?: string; coEditors?: string[];
};
export type Project = {
  id: string; slug: string; title: string; character: string; work: string; artistIds: string[];
  category: string; date: string | null; summary: string; participation: string; process: string;
  techniques: string[]; tools: string[]; credits: string; creditSource: string;
  coverUrl: string | null; coverSource: 'spotify' | 'youtube' | 'official' | 'uploaded' | null; coverAlt: string;
  coverSourceUrl?: string; checkedAt?: string; videoAvailability?: 'available' | 'members-only' | 'unavailable' | 'unknown';
  coverPosition: { x: number; y: number }; coverCredit: string;
  youtubeUrl: string | null; spotifyUrl: string | null; xUrl: string | null;
  editShowcaseUrl?: string; editShowcaseDuration?: number; toolsSource?: string;
  segments: Segment[]; processImages: string[];
  featured: boolean; featuredOrder: number | null; order: number; status: PublishStatus;
  accent: string; verification: string;
};
export type SiteSettings = {
  name: string; avatarUrl: string; headline: string; bio: string; career: string;
  email: string; xUrl: string; instagramUrl: string; linktreeUrl: string;
  whatsapp: string; showreelUrl: string;
};
export type PortfolioData = { projects: Project[]; artists: Artist[]; settings: SiteSettings; mode: 'local' | 'supabase' };
export type Inquiry = { id: string; name: string; email: string; type: string; duration: string; deadline: string; references: string; budget: string; message: string; status: 'new' | 'read' | 'replied'; createdAt: string };
