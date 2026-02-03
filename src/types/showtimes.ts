export interface Showtime {
  time: string;
  auditorium: string;
  capacity: number;
  formId: number | null;
  url: string;
}

export interface DateInfo {
  date: string;
  label: string;
  showtimes: Showtime[];
}

export interface Theater {
  id: string;
  name: string;
  location: string;
  address?: string;
  dates: DateInfo[];
}

export interface ShowtimesConfig {
  eventName: string;
  ticketPrice: number;
  theaters: Theater[];
}

export interface InventoryItem {
  formId: number;
  sold: number;
  capacity: number;
  available: number;
  status: 'available' | 'low_stock' | 'sold_out' | 'unavailable';
}

export interface InventoryResponse {
  [formId: number]: InventoryItem;
}
