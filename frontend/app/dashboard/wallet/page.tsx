"use client"

import { useState, useEffect } from "react"
import { WalletBalance } from "@/components/wallet/wallet-balance"
import { TransactionHistory } from "@/components/wallet/transaction-history"
import { Button } from "@/components/ui/button"
import { ArrowUpRight, RefreshCw } from "lucide-react"
import { toast } from "sonner"

const API_URL = "http://localhost:8000"

export default function WalletPage() {
  const [balance, setBalance] = useState({ balance: 0, locked: 0, currency: "USDT" })
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)
  const [depositing, setDepositing] = useState(false)

  const fetchData = async () => {
    try {
      const token = localStorage.getItem("token")
      if (!token) {
        setLoading(false)
        return
      }

      // Fetch Balance
      const balanceRes = await fetch(`${API_URL}/wallets/balance`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (balanceRes.ok) {
        const data = await balanceRes.json()
        setBalance(data)
      }

      // Fetch Transactions
      const txRes = await fetch(`${API_URL}/wallets/history/transactions`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (txRes.ok) {
        const data = await txRes.json()
        setTransactions(data)
      }
    } catch (error) {
      console.error("Failed to fetch wallet data:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleWithdrawalRequest = () => {
    toast.info("Withdrawal portal is under maintenance. Please contact support.")
  }

  if (loading) {
// ...
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <RefreshCw className="h-8 w-8 animate-spin text-indigo-500" />
      </div>
    )
  }

  return (
    <div className="space-y-8 p-6 lg:p-10 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
            My Wallet
          </h1>
          <p className="mt-2 text-muted-foreground">
            Manage your assets and track your transaction history.
          </p>
        </div>
        <Button 
          onClick={handleWithdrawalRequest} 
          className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-500/20 px-6 py-6 h-auto text-lg transition-all active:scale-95"
        >
          <ArrowUpRight className="mr-2 h-5 w-5" />
          Withdraw Funds
        </Button>
      </div>

      <WalletBalance 
        balance={Number(balance.balance)} 
        locked={Number(balance.locked)} 
        currency={balance.currency} 
      />

      <div className="space-y-4">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          Transaction History
        </h2>
        <TransactionHistory transactions={transactions} />
      </div>
    </div>
  )
}
