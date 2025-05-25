"use client";

import React, { useState, useEffect } from 'react';
import { ethers, parseUnits } from 'ethers';
import { useCarbonCredit } from '../../hooks/useCarbonCredit';
import { TokenBalance } from '../../lib/types';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from '../ui/card';

export const RetireCreditsForm: React.FC = () => {
  const { retireTokens, tokenBalances, fetchTokenBalances } = useCarbonCredit();
  const [selectedProjectBalance, setSelectedProjectBalance] = useState<TokenBalance | null>(null);
  const [amountToRetire, setAmountToRetire] = useState<string>("1");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleRetire = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProjectBalance || parseFloat(amountToRetire) <= 0) {
      setError("Please select a project and enter a valid amount to retire.");
      return;
    }
    if (parseFloat(amountToRetire) > parseFloat(selectedProjectBalance.amount)) {
        setError("Amount to retire exceeds your balance for this project.");
        return;
    }

    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const amountBN = parseUnits(amountToRetire, 0); // Assuming 0 decimals for carbon credits
      const tx = await retireTokens(selectedProjectBalance.projectId, amountBN);
      setSuccessMessage(`Successfully retired ${amountToRetire} credits from ${selectedProjectBalance.projectName}! Tx: ${tx.hash}`);
      setSelectedProjectBalance(null);
      setAmountToRetire("1");
      fetchTokenBalances(); // Refresh balances
    } catch (err: any) {
      console.error("Retire failed:", err);
      setError(err.message || "Failed to retire credits. Check console for details.");
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleProjectSelect = (projectId: string) => {
    const balance = tokenBalances.find(b => b.projectId === projectId);
    setSelectedProjectBalance(balance || null);
  };

  if (tokenBalances.length === 0) {
    return (
        <Card className="w-full max-w-md">
            <CardHeader><CardTitle>Retire Carbon Credits</CardTitle></CardHeader>
            <CardContent><p>You do not own any carbon credits to retire.</p></CardContent>
        </Card>
    );
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Retire Carbon Credits</CardTitle>
        <CardDescription>Select credits you own and specify an amount to retire.</CardDescription>
      </CardHeader>
      <form onSubmit={handleRetire}>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="owned-project">Your Owned Credits</Label>
            <Select onValueChange={handleProjectSelect} value={selectedProjectBalance?.projectId || ""}>
              <SelectTrigger id="owned-project">
                <SelectValue placeholder="Select owned credits" />
              </SelectTrigger>
              <SelectContent>
                {tokenBalances.map((bal) => (
                  <SelectItem key={bal.projectId} value={bal.projectId.toString()}>
                    {bal.projectName} (Balance: {bal.amount})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {selectedProjectBalance && (
            <div>
              <Label htmlFor="retire-amount">Amount to Retire</Label>
              <Input 
                id="retire-amount" 
                type="number" 
                value={amountToRetire} 
                onChange={(e) => setAmountToRetire(e.target.value)} 
                min="1"
                max={selectedProjectBalance.amount} // Set max based on owned balance
                placeholder="Number of credits"
              />
            </div>
          )}
        </CardContent>
        <CardFooter className="flex flex-col items-start">
          <Button type="submit" disabled={isLoading || !selectedProjectBalance || parseFloat(amountToRetire) <= 0}>
            {isLoading ? "Processing..." : "Retire Credits"}
          </Button>
          {error && <p className="mt-2 text-sm text-red-600">Error: {error}</p>}
          {successMessage && <p className="mt-2 text-sm text-green-600">{successMessage}</p>}
        </CardFooter>
      </form>
    </Card>
  );
}; 