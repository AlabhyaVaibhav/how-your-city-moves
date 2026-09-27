/*
 * The single list of analytics events and their exact props.
 * track() only accepts these names and these props (extra keys are a type error).
 * Keep docs/analytics.md in sync when you change this file.
 */
import type { AreaId } from "../../app/data";
import type { CommuteBucket, SpeedBucket } from "../../app/sim";

export type ShareMethod = "native" | "copy" | "whatsapp" | "x" | "linkedin";
export type ShareLocation = "map" | "footer";

type None = Record<string, never>;

export interface EventMap {
  commuter_added: { home_area: AreaId; work_area: AreaId; commute_bucket: CommuteBucket; used_random_name: boolean; shared_to_city: boolean };
  commuter_removed: None;
  sample_reset: None;
  add_dialog_opened: { source: "map_cta" };
  add_dialog_abandoned: None;
  playback_toggled: { state: "play" | "pause" };
  timeline_scrubbed: { hour: number };
  speed_changed: { speed_bucket: SpeedBucket };
  names_toggled: { visible: boolean };
  district_hovered: { area: AreaId };
  city_view_toggled: { view: "yours" | "everyone" };
  data_cleared: None;
  /** Intent only: UPI payments happen in the payer's app, so completion can't be seen. */
  chip_in_clicked: { amount: number; method: "upi_app" | "copy_id" };
  outbound_click: { destination: string };
  share_clicked: { location: ShareLocation };
  share_completed: { method: ShareMethod };
  shared_visit: { method: ShareMethod | "unknown" };
}

export type EventName = keyof EventMap;
export type Props = Record<string, string | number | boolean>;
/** Events with no props are called as track("name"). */
export type TrackArgs<E extends EventName> = EventMap[E] extends None ? [] : [props: EventMap[E]];
