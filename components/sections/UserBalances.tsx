"use client";

import React from 'react';
import { useMockUSDC } from '../../hooks/useMockUSDC'; // Adjusted path
import { useCarbonCredit } from '../../hooks/useCarbonCredit'; // Adjusted path
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'; // Assuming shadcn/ui is in frontend/components/ui

export const UserBalances: React.FC = () => {
  const { balance: usdcBalance, getBalance: refreshUsdcBalance } = useMockUSDC();
  const { tokenBalances, fetchTokenBalances } = useCarbonCredit();

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Your Balances</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold">MockUSDC</h3>
            <p className="text-2xl">{parseFloat(usdcBalance).toFixed(2)} USDC</p>
            <button onClick={refreshUsdcBalance} className="text-sm text-blue-500 hover:underline">Refresh</button>
          </div>
          <div>
            <h3 className="text-lg font-semibold">Carbon Credits</h3>
            {tokenBalances.length > 0 ? (
              <ul className="space-y-2">
                {tokenBalances.map((bal) => (
                  <li key={bal.projectId} className="flex justify-between">
                    <span>{bal.projectName} (ID: {bal.projectId})</span>
                    <span>{bal.amount} Credits</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p>No carbon credits held.</p>
            )}
            <button onClick={fetchTokenBalances} className="mt-2 text-sm text-blue-500 hover:underline">Refresh Credits</button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}; 