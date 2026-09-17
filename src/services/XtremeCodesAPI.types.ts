export type XtremeCodesConfig = {
  baseUrl: string
  auth: XtremeCodesAuth
}

export type XtremeCodesAuth = {
  username: string
  password: string
}

export interface UserInfo {
  active_cons?: number // actually string
  allowed_output_formats?: string[]
  auth?: number
  created_at?: number // string act
  exp_date?: number // string act
  is_trial?: number // actually string
  max_connections?: number // actually string
  message?: string
  password?: string
  status?: string
  username?: string
}

export interface ServerInfo {
  url: string
  port: number
  https_port?: number
  server_protocol?: string
  rtmp_port?: number
  timezone?: string
  timestamp_now?: number | string
  time_now?: string
  process?: boolean
}

export interface AccountInfo {
  user_info?: UserInfo
  server_info?: ServerInfo
}

export interface Category {
  category_id?: number // actually string
  category_name?: string
  parent_id?: number
}

export interface Stream {
  added?: number
  category_id?: number
  category_ids?: number[]
  custom_sid?: string
  direct_source?: string
  is_adult?: number
  name?: string
  num?: number
  stream_icon?: string
  stream_id?: number
  stream_type?: string // live or movie or ?
}

export interface LiveStream extends Stream {
  epg_channel_id?: string
  tv_archive?: number
  tv_archive_duration?: number
}

export interface VodStream extends Stream {
  container_extension?: string
  rating?: number
  rating_5based?: number
  tmdb?: string
  trailer?: string
}

export interface SeriesStream {
  category_id?: number
  category_ids?: number[]
  num?: number
  name?: string
  series_id?: number
  cover?: string
  plot?: string
  cast?: string
  director?: string
  genre?: string
  releaseDate?: string
  last_modified?: string
  rating?: number
  rating_5based?: number
  backdrop_path?: string[]
  youtube_trailer?: string
  tmdb?: string
  episode_run_time?: number
}

export interface VodInfo {
  info?: {
    tmdb_id?: number
    name?: string
    o_name?: string
    cover_big?: string
    movie_image?: string
    releasedate?: string
    youtube_trailer?: string
    director?: string
    actors?: string
    cast?: string
    description?: string
    plot?: string
    age?: string // wtf is this
    country?: string
    genre?: string
    backdrop_path?: string[]
    duration_secs?: number
    duration?: string
    video?: VideoInformation
    audio?: AudioInformation
    bitrate?: number
    rating?: number
    status?: string // Released or ??
  }
  movie_data?: VodStream
}

export interface SeriesInfo {
  seasons?: SeriesSeason[]
  info?: {
    name?: string
    cover?: string
    plot?: string
    cast?: string
    director?: string
    genre?: string
    releaseDate?: string
    last_modified?: number
    rating?: number
    rating_5based?: number
    backdrop_path?: string[]
    tmdb?: number
    youtube_trailer?: string
    episode_run_time?: number
    category_id?: number
    category_ids?: number[]
  }
  episodes?: { [key: string]: SeriesEpisode[] }
}

export interface SeriesEpisode {
  id?: number
  episode_num?: number
  title?: string
  container_extension?: string
  info?: {
    tmdb_id?: number
    air_date?: string
    rating?: number
    season?: number
    plot?: string
    movie_image?: string
    duration_secs?: number
    duration?: string
    video?: VideoInformation
    audio?: AudioInformation
    bitrate?: number
    release_date?: string
  }
  custom_sid?: string
  added?: number
  season?: number
  direct_source?: string
}

export interface SeriesSeason {
  name?: string
  episode_count?: number
  overview?: string
  air_date?: string
  cover?: string
  cover_tmdb?: string
  season_number?: number
  cover_big?: string
  releaseDate?: string
  duration?: number
}

export interface Disposition {
  default?: number
  dub?: number
  original?: number
  comment?: number
  lyrics?: number
  karaoke?: number
  forced?: number
  hearing_impaired?: number
  visual_impaired?: number
  clean_effects?: number
  attached_pic?: number
  timed_thumbnails?: number
  captions?: number
  descriptions?: number
  metadata?: number
  dependent?: number
  still_image?: number
}

export interface Tags {
  language?: string
  title?: string
  BPS?: number
  NUMBER_OF_FRAMES?: number
  NUMBER_OF_BYTES?: number
  _STATISTICS_WRITING_APP?: string
  _STATISTICS_TAGS?: string
  ENCODER?: string
  DURATION?: string
}

export interface VideoInformation {
  index?: number
  codec_name?: string
  codec_long_name?: string
  profile?: string // number or string ??
  codec_type?: CodecType
  codec_tag_string?: string
  codec_tag?: string // number or string ??
  width?: number
  height?: number
  coded_width?: number
  coded_height?: number
  closed_captions?: number
  film_grain?: number
  has_b_frames?: number
  sample_aspect_ratio?: string
  display_aspect_ratio?: string
  pix_fmt?: string
  level?: number
  color_range?: string // 'tv' or ??
  color_space?: string
  color_transfer?: string
  color_primaries?: string
  chroma_location?: string
  field_order?: string // progressive or ??
  refs?: number
  is_avc?: boolean // check if casting is done properly, sent as string
  nal_length_size?: number
  r_frame_rate?: string
  avg_frame_rate?: string
  time_base?: string
  start_pts?: number
  start_time?: number
  bits_per_raw_sample?: number
  extradata_size?: number
  disposition?: Disposition
  tags?: Tags
}

export interface AudioInformation {
  index?: number
  codec_name?: string
  codec_long_name?: string
  profile?: string // string or number?
  codec_type?: CodecType
  codec_tag_string?: string
  codec_tag?: string // string or num?
  sample_fmt?: string
  sample_rate?: number
  channels?: number
  channel_layout?: string // stereo or ??
  bits_per_sample?: number
  r_frame_rate?: string
  avg_frame_rate?: string
  time_base?: string
  start_pts?: number
  start_time?: number
  extradata_size?: number
  disposition?: Disposition
  tags?: Tags
}

export type CodecType = "audio" | "video"

export interface LiveStreamEPG {
  epg_listings?: LiveStreamEPGItem[]
}

export interface LiveStreamEPGItem {
  // NOTE: Xtream providers serialize most numeric fields as strings
  // (e.g. start_timestamp: "1789608600"). Always normalize with Number()
  // before comparing , never rely on implicit coercion or strict equality.
  id?: number | string
  epg_id?: number | string
  title?: string
  lang?: string
  start?: string
  end?: string
  description?: string
  channel_id?: string
  start_timestamp?: number | string
  stop_timestamp?: number | string
  now_playing?: number | string
  has_archive?: number | string
  stream_id?: number | string
}
