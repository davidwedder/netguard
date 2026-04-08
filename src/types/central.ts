export interface Central {
  id: string;
  user_id: string;
  name: string;
  location: string | null;
  model: string | null;
  serial_number: string | null;
  ip_address: string | null;
  online: boolean;
  battery_ok: boolean;
  ac_power_ok: boolean;
  last_communication: Date | null;
  created_at: Date;
  updated_at: Date;
}