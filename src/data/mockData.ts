import { AlarmSystem, Zone, AlarmEvent } from '@/types/alarm';

export const mockAlarmSystem: AlarmSystem = {
  online: true,
  batteryOk: true,
  acPowerOk: true,
  lastCommunication: new Date(),
  status: 'disarmed',
  lastUser: 'Admin',
};

export const mockZones: Zone[] = [
  { id: '1', name: 'Entrada Principal', status: 'normal', location: 'Térreo' },
  { id: '2', name: 'Sala Comercial', status: 'normal', location: 'Térreo' },
  { id: '3', name: 'Corredor Norte', status: 'normal', location: '1º Andar' },
  { id: '4', name: 'Sala de Reuniões', status: 'normal', location: '1º Andar' },
  { id: '5', name: 'Depósito', status: 'bypass', location: 'Subsolo' },
  { id: '6', name: 'Recepção', status: 'normal', location: 'Térreo' },
  { id: '7', name: 'Estacionamento', status: 'normal', location: 'Externo' },
  { id: '8', name: 'Cofre', status: 'normal', location: '1º Andar' },
];

export const mockEvents: AlarmEvent[] = [
  {
    id: '1',
    type: 'command',
    timestamp: new Date(Date.now() - 1000 * 60 * 5),
    description: 'Sistema desarmado por Admin',
  },
  {
    id: '2',
    type: 'door',
    timestamp: new Date(Date.now() - 1000 * 60 * 15),
    description: 'Porta principal aberta',
    zone: 'Entrada Principal',
  },
  {
    id: '3',
    type: 'motion',
    timestamp: new Date(Date.now() - 1000 * 60 * 30),
    description: 'Movimento detectado',
    zone: 'Corredor Norte',
  },
  {
    id: '4',
    type: 'command',
    timestamp: new Date(Date.now() - 1000 * 60 * 45),
    description: 'Sistema armado (total) por Supervisor',
  },
];