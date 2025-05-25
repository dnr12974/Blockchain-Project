"use client";

import React from 'react';
import { UserBalances } from './UserBalances';
import { BuyCreditsForm } from '../forms/BuyCreditsForm';
import { RetireCreditsForm } from '../forms/RetireCreditsForm';
import { TradeHistoryTable } from '../trade-history-table'; // Assuming this is the correct path
import { useCarbonCredit } from '../../hooks/useCarbonCredit';
import { useMockUSDC } from '../../hooks/useMockUSDC'; // For USDC decimals in history formatting
import { CombinedEvent, TradeEvent, RetireEvent, Project } from '../../lib/types';
import projectsData from '@/public/data/projects.json'; // Import projectsData directly
import { formatUnits } from 'ethers';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';

// Helper to format event data for the table
const formatHistoryForTable = (history: CombinedEvent[], usdcDecimals: number, allProjects: Project[]) => {
  return history.map(event => {
    const project = allProjects.find(p => p.id.toString() === event.projectId.toString());
    const projectName = project ? project.name : event.projectName || 'Unknown Project';
    const formattedAmount = formatUnits(event.amount, 0); // Assuming 0 decimals for carbon credits

    let details = `Project: ${projectName} (ID: ${event.projectId}), Amount: ${formattedAmount}`;
    if (event.type === 'Trade') {
      const trade = event as TradeEvent;
      const formattedPrice = formatUnits(trade.price, usdcDecimals);
      details += `, Price: ${formattedPrice} USDC, Buyer: ${trade.buyer.substring(0,6)}..., Seller: ${trade.seller.substring(0,6)}...`;
    } else {
      const retire = event as RetireEvent;
      details += `, Owner: ${retire.owner.substring(0,6)}...`;
    }
    return {
      id: event.transactionHash, // Use tx hash as a unique key for rows
      type: event.type,
      details: details,
      timestamp: event.timestamp ? new Date(event.timestamp * 1000).toLocaleString() : new Date(event.blockNumber).toLocaleTimeString(), // Fallback, block number not a timestamp
      txHash: event.transactionHash
    };
  });
};

export const TradingDashboard: React.FC = () => {
  const { transactionHistory } = useCarbonCredit();
  const { decimals: usdcDecimals } = useMockUSDC();
  
  const allProjects: Project[] = projectsData;

  const formattedHistory = formatHistoryForTable(transactionHistory, usdcDecimals, allProjects);

  return (
    <div className="container mx-auto p-4 space-y-8">
      <UserBalances />
      
      <div className="grid md:grid-cols-2 gap-8">
        <BuyCreditsForm />
        <RetireCreditsForm />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Transaction History</CardTitle>
          <CardDescription>Recent buy and retire activities.</CardDescription>
        </CardHeader>
        <CardContent>
          {formattedHistory.length > 0 ? (
            <TradeHistoryTable historyEvents={formattedHistory} />
          ) : (
            <p>No transaction history yet.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}; 