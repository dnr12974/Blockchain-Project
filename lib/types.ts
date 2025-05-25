import { BigNumberish } from 'ethers';

export interface Project {
  id: number; // Changed to number
  name: string;
  gsid?: number; // Added gsid as it appears in your error
  locationName?: string; // Added
  type?: string; // Added
  mockPricePerToken: string; // Changed from pricePerToken: number
  totalMinted?: number; // Added
  coordinates?: number[]; // Changed from [number, number] to number[]
  description?: string;
  // availableSupply?: number; // This was in my original type, check if needed
}

export interface TokenBalance {
  projectId: string;
  projectName: string;
  amount: string; // Formatted amount
}

interface BaseEvent {
  projectId: string;
  projectName?: string; // Optional: to be enriched later
  amount: BigNumberish;
  transactionHash: string;
  timestamp?: number; // Added via block.timestamp in contract or fetched from block
  blockNumber: number;
}

export interface TradeEvent extends BaseEvent {
  type: 'Trade';
  buyer: string;
  seller: string;
  price: BigNumberish; // Total price or price per token, ensure consistency with contract event
}

export interface RetireEvent extends BaseEvent {
  type: 'Retire';
  owner: string;
}

export type CombinedEvent = TradeEvent | RetireEvent; 