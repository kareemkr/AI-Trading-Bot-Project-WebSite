"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Wallet, ArrowUpRight, ArrowDownLeft, Lock } from "lucide-react"

interface WalletBalanceProps {
  balance: number
  locked: number
  currency: string
}

export function WalletBalance({ balance, locked, currency }: WalletBalanceProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      <Card className="bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border-indigo-500/20">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Available Balance</CardTitle>
          <Wallet className="h-4 w-4 text-indigo-400" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{(balance - locked).toFixed(2)} {currency}</div>
          <p className="text-xs text-muted-foreground mt-1">Ready for trading or withdrawal</p>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-amber-500/10 to-orange-500/10 border-amber-500/20">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Locked Balance</CardTitle>
          <Lock className="h-4 w-4 text-amber-400" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{locked.toFixed(2)} {currency}</div>
          <p className="text-xs text-muted-foreground mt-1">Reserved for open positions</p>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border-emerald-500/20">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Balance</CardTitle>
          <ArrowUpRight className="h-4 w-4 text-emerald-400" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{balance.toFixed(2)} {currency}</div>
          <p className="text-xs text-muted-foreground mt-1">Sum of available and locked</p>
        </CardContent>
      </Card>
    </div>
  )
}
