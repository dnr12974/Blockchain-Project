"use client";

import React, { useState, useEffect } from 'react';
import { ethers, parseUnits, ZeroAddress } from 'ethers';
import { useMockUSDC } from '../../hooks/useMockUSDC';
import { useCarbonCredit } from '../../hooks/useCarbonCredit';
import { Project } from '../../lib/types';
import projectsData from '../../public/data/projects.json';
import { Button } from '../ui/button'; // Assuming shadcn/ui
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from '../ui/card';

export const BuyCreditsForm: React.FC = () => {
  const { decimals: usdcDecimals, balance: usdcBalance } = useMockUSDC();
  const { initiateBuyCreditsProcess, fetchTokenBalances } = useCarbonCredit();
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const [amount, setAmount] = useState<string>("1");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [totalCost, setTotalCost] = useState<string>("0");

  const projects: Project[] = projectsData;
  const selectedProject = projects.find(p => p.id.toString() === selectedProjectId);

  useEffect(() => {
    if (selectedProject && parseFloat(amount) > 0 && usdcDecimals) {
      const cost = parseFloat(amount) * parseFloat(selectedProject.mockPricePerToken);
      setTotalCost(cost.toFixed(usdcDecimals));
    } else {
      setTotalCost("0");
    }
  }, [selectedProject, amount, usdcDecimals]);

  const handleBuy = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProject || parseFloat(amount) <= 0) {
      setError("Please select a project and enter a valid amount.");
      return;
    }
    if (parseFloat(totalCost) > parseFloat(usdcBalance)) {
        setError("Insufficient USDC balance.");
        return;
    }

    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);

    // Define sellerAddress - for now, assuming it's the deployer or a known address.
    // Replace with actual logic or config later.
    const sellerAddress = "0x5d3Cd01f5f1646cd52ccb00edeFF5f3943e7F60d"; // TODO: Make this dynamic or configurable

    if (sellerAddress === ZeroAddress) { // Basic check
        setError("Seller address is not configured correctly.");
        setIsLoading(false);
        return;
    }

    try {
      // initiateBuyCreditsProcess expects strings for amount and price
      // selectedProject.mockPricePerToken is already a string (as per its usage for totalCost)
      // amount is already a string (from useState<string>)

      // The approveUSDC call is now handled inside initiateBuyCreditsProcess
      // await approveUSDC(CARBON_CREDIT_CONTRACT_ADDRESS, costBN); 
      
      const tx = await initiateBuyCreditsProcess(
        selectedProject.id.toString(), 
        amount, // amount is already a string
        selectedProject.mockPricePerToken, // this is already a string from projects.json
        sellerAddress
      );
      setSuccessMessage(`Successfully bought ${amount} credits for ${selectedProject.name}! Tx: ${tx.hash}`);
      setSelectedProjectId("");
      setAmount("1");
      fetchTokenBalances();
    } catch (err: any) {
      console.error("Buy failed:", err);
      setError(err.message || "Failed to buy credits. Check console for details.");
    } finally {
      setIsLoading(false);
    }
  };

  if (!projects || projects.length === 0) {
    return <p>No projects available for purchase.</p>;
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Buy Carbon Credits</CardTitle>
        <CardDescription>Select a project and amount to purchase.</CardDescription>
      </CardHeader>
      <form onSubmit={handleBuy}>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="project">Project</Label>
            <Select onValueChange={setSelectedProjectId} value={selectedProjectId}>
              <SelectTrigger id="project">
                <SelectValue placeholder="Select a project" />
              </SelectTrigger>
              <SelectContent>
                {projects.map((p) => (
                  <SelectItem key={p.id} value={p.id.toString()}>
                    {p.name} (${p.mockPricePerToken}/credit)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="amount">Amount</Label>
            <Input 
              id="amount" 
              type="number" 
              value={amount} 
              onChange={(e) => setAmount(e.target.value)} 
              min="1"
              placeholder="Number of credits"
            />
          </div>
          {selectedProject && (
            <div>
              <p>Total Cost: {totalCost} USDC</p>
              <p className="text-xs">Available USDC: {parseFloat(usdcBalance).toFixed(2)}</p>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex flex-col items-start">
          <Button type="submit" disabled={isLoading || !selectedProjectId || parseFloat(amount) <= 0}>
            {isLoading ? "Processing..." : "Buy Credits"}
          </Button>
          {error && <p className="mt-2 text-sm text-red-600">Error: {error}</p>}
          {successMessage && <p className="mt-2 text-sm text-green-600">{successMessage}</p>}
        </CardFooter>
      </form>
    </Card>
  );
}; 