"use client"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { format } from "date-fns"
import { ArrowUpRight, ArrowDownLeft } from "lucide-react"

interface Transaction {
  id: number
  type: string
  amount: number
  status: string
  created_at: string
  reference?: string
}

interface TransactionHistoryProps {
  transactions: Transaction[]
}

export function TransactionHistory({ transactions }: TransactionHistoryProps) {
  return (
    <div className="rounded-md border border-white/10 bg-black/20 backdrop-blur-md overflow-hidden">
      <Table>
        <TableHeader className="bg-white/5">
          <TableRow>
            <TableHead>Type</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Reference</TableHead>
            <TableHead className="text-right">Date</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {transactions.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                No transactions yet
              </TableCell>
            </TableRow>
          ) : (
            transactions.map((tx) => (
              <TableRow key={tx.id} className="hover:bg-white/5 transition-colors border-white/5">
                <TableCell className="font-medium">
                  <div className="flex items-center gap-2">
                    {tx.type === "deposit" ? (
                      <ArrowDownLeft className="h-4 w-4 text-emerald-400" />
                    ) : (
                      <ArrowUpRight className="h-4 w-4 text-rose-400" />
                    )}
                    <span className="capitalize">{tx.type}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <span className={tx.type === "deposit" ? "text-emerald-400" : "text-rose-400"}>
                    {tx.type === "deposit" ? "+" : "-"}{Number(tx.amount).toFixed(2)}
                  </span>
                </TableCell>
                <TableCell>
                  <Badge 
                    variant={tx.status === "confirmed" ? "default" : tx.status === "failed" ? "destructive" : "secondary"} 
                    className={`
                      ${tx.status === "confirmed" ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" : ""}
                      ${tx.status === "pending" ? "bg-amber-500/10 text-amber-500 border-amber-500/20" : ""}
                      ${tx.status === "failed" ? "" : "hover:bg-white/20 border-white/10"}
                    `}
                  >
                    {tx.status === "confirmed" ? "Confirmed" : tx.status === "pending" ? "Pending Confirmation" : tx.status}
                  </Badge>
                </TableCell>
                <TableCell className="font-mono text-xs text-muted-foreground max-w-[150px] truncate">
                  {tx.reference || "N/A"}
                </TableCell>
                <TableCell className="text-right text-muted-foreground text-xs">
                  {format(new Date(tx.created_at), "MMM d, HH:mm")}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  )
}
