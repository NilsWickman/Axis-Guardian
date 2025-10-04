/**
 * Configuration-related types
 *
 * TODO: Generate these from OpenAPI schemas
 */

export interface Site {
  site_id: string;
  name: string;
  floor_plan_url?: string;
  created_at: string;
  updated_at: string;
}

export interface Zone {
  zone_id: string;
  site_id: string;
  name: string;
  type: 'restricted' | 'public' | 'monitored';
  coordinates: Array<{ x: number; y: number }>;
  schedule_id?: string;
  created_at: string;
  updated_at: string;
}

export interface DetectionLine {
  line_id: string;
  site_id: string;
  name: string;
  start: { x: number; y: number };
  end: { x: number; y: number };
  direction?: 'bidirectional' | 'forward' | 'backward';
  created_at: string;
  updated_at: string;
}

export interface Schedule {
  schedule_id: string;
  name: string;
  rules: Array<{
    days: number[];
    start_time: string;
    end_time: string;
  }>;
  created_at: string;
  updated_at: string;
}
