export interface DateInfo {
  date: string;
  label: string;
  showtimes: number[]; // Array of form IDs
}

export interface Theater {
  id: string;
  name: string;
  location: string;
  address?: string;
  googlePlaceId?: string;
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
  url: string;
  time: string;
  eventStart: string;
}

export interface InventoryResponse {
  [formId: number]: InventoryItem;
}
