export type AlarmStatus = 'armed-total' | 'armed-partial' | 'disarmed' | 'triggered';
export type ZoneStatus = 'normal' | 'open' | 'violated' | 'bypass';
export type EventType = 'motion' | 'zone-trigger' | 'tamper' | 'power-fail' | 'door' | 'command';

export interface AlarmSystem {
  online: boolean;
  batteryOk: boolean;
  acPowerOk: boolean;
  lastCommunication: Date;
  status: AlarmStatus;
  lastUser: string;
}

export interface Zone {
  id: string;
  name: string;
  status: ZoneStatus;
  location: string;
}

export interface AlarmEvent {
  id: string;
  type: EventType;
  timestamp: Date;
  description: string;
  zone?: string;
}