import { ethers } from 'ethers';

declare global {
  interface Window {
    ethereum?: ethers.Eip1193Provider & {
      isMetaMask?: boolean;
      request: (...args: any[]) => Promise<any>; // More generic request method
      on: (event: string, listener: (...args: any[]) => void) => void;
      removeListener: (event: string, listener: (...args: any[]) => void) => void;
      // Add other specific methods or properties if your app relies on them
      // For example, for chainChanged, accountsChanged events
    };
  }
} 