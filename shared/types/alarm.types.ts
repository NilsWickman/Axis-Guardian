/**
 * Alarm-related types
 *
 * TODO: Generate these from OpenAPI schemas
 */

export interface AlarmEvent {
  alarm_id: string;
  track_id: string;
  site_id: string;
  zone_id: string;
  object_type: 'person' | 'vehicle' | 'animal';
  first_seen: string;
  position: {
    x: number;
    y: number;
  };
  evidence: string[];
  confidence: number;
  matched_rules: string[];
  status: 'open' | 'confirmed' | 'dismissed' | 'closed';
  created_at: string;
  updated_at: string;
}

export interface AlarmConfirmation {
  alarm_id: string;
  confirmed_by: string;
  confirmed_at: string;
  notes?: string;
}

export interface AlarmDismissal {
  alarm_id: string;
  dismissed_by: string;
  dismissed_at: string;
  reason: string;
  notes?: string;
}
