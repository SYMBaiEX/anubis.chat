'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  Eye,
  EyeOff,
  Copy,
  ExternalLink,
  AlertCircle,
  CheckCircle,
  Coins,
  DollarSign,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface TokenBalance {
  symbol: string;
  name: string;
  balance: number;
  decimals: number;
  usdValue?: number;
  change24h?: number;
  icon?: string;
}

interface WalletBalanceWidgetProps {
  address?: string;
  balances?: TokenBalance[];
  totalUsdValue?: number;
  isLoading?: boolean;
  onRefresh?: () => void;
  onSend?: () => void;
  onReceive?: () => void;
  variant?: 'compact' | 'detailed' | 'card';
  showUsdValues?: boolean;
  className?: string;
}

export function WalletBalanceWidget({
  address,
  balances = [],
  totalUsdValue = 0,
  isLoading = false,
  onRefresh,
  onSend,
  onReceive,
  variant = 'card',
  showUsdValues = true,
  className
}: WalletBalanceWidgetProps) {
  const [hideBalances, setHideBalances] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 4)}...${addr.slice(-4)}`;
  };

  const formatBalance = (balance: number, decimals: number) => {
    const value = balance / Math.pow(10, decimals);
    if (value >= 1000000) return `${(value / 1000000).toFixed(2)}M`;
    if (value >= 1000) return `${(value / 1000).toFixed(2)}K`;
    if (value < 0.01) return value.toExponential(2);
    return value.toFixed(4);
  };

  const formatUsd = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  const handleCopyAddress = async () => {
    if (address) {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      toast.success('Address copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    onRefresh?.();
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  const mainToken = balances.find(b => b.symbol === 'SOL') || balances[0];
  const otherTokens = balances.filter(b => b.symbol !== 'SOL');

  if (variant === 'compact') {
    return (
      <div className={cn('flex items-center gap-3', className)}>
        <div className="flex items-center gap-2">
          <Wallet className="h-4 w-4 text-muted-foreground" />
          {isLoading ? (
            <Skeleton className="h-4 w-20" />
          ) : (
            <span className="font-medium">
              {hideBalances ? '••••••' : formatUsd(totalUsdValue)}
            </span>
          )}
        </div>
        
        {address && (
          <Badge variant="secondary" className="font-mono">
            {formatAddress(address)}
          </Badge>
        )}
        
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => setHideBalances(!hideBalances)}
          >
            {hideBalances ? (
              <Eye className="h-3.5 w-3.5" />
            ) : (
              <EyeOff className="h-3.5 w-3.5" />
            )}
          </Button>
          
          {onRefresh && (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={handleRefresh}
              disabled={isRefreshing}
            >
              <RefreshCw className={cn(
                "h-3.5 w-3.5",
                isRefreshing && "animate-spin"
              )} />
            </Button>
          )}
        </div>
      </div>
    );
  }

  if (variant === 'detailed') {
    return (
      <div className={cn('space-y-4', className)}>
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Wallet className="h-5 w-5 text-muted-foreground" />
            <span className="font-semibold">Wallet Balance</span>
          </div>
          
          <div className="flex items-center gap-2">
            {address && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleCopyAddress}
                    >
                      {copied ? (
                        <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
                      ) : (
                        <Copy className="h-4 w-4 mr-2" />
                      )}
                      {formatAddress(address)}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    {copied ? 'Copied!' : 'Click to copy full address'}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
            
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setHideBalances(!hideBalances)}
            >
              {hideBalances ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        {/* Total Value */}
        <div className="text-center py-4">
          {isLoading ? (
            <Skeleton className="h-10 w-32 mx-auto" />
          ) : (
            <div>
              <div className="text-3xl font-bold">
                {hideBalances ? '••••••' : formatUsd(totalUsdValue)}
              </div>
              <div className="text-sm text-muted-foreground mt-1">
                Total Portfolio Value
              </div>
            </div>
          )}
        </div>

        {/* Token List */}
        <div className="space-y-2">
          {isLoading ? (
            <>
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </>
          ) : (
            <AnimatePresence>
              {balances.map((token, index) => (
                <motion.div
                  key={token.symbol}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                >
                  <div className="flex items-center gap-3">
                    {token.icon ? (
                      <img src={token.icon} alt={token.symbol} className="h-8 w-8 rounded-full" />
                    ) : (
                      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <Coins className="h-4 w-4" />
                      </div>
                    )}
                    
                    <div>
                      <div className="font-medium">{token.symbol}</div>
                      <div className="text-xs text-muted-foreground">{token.name}</div>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="font-medium">
                      {hideBalances ? '•••' : formatBalance(token.balance, token.decimals)}
                    </div>
                    {showUsdValues && token.usdValue !== undefined && (
                      <div className="text-xs text-muted-foreground">
                        {hideBalances ? '•••' : formatUsd(token.usdValue)}
                      </div>
                    )}
                  </div>
                  
                  {token.change24h !== undefined && (
                    <div className={cn(
                      "flex items-center gap-1 text-sm",
                      token.change24h >= 0 ? "text-green-500" : "text-red-500"
                    )}>
                      {token.change24h >= 0 ? (
                        <TrendingUp className="h-3 w-3" />
                      ) : (
                        <TrendingDown className="h-3 w-3" />
                      )}
                      {Math.abs(token.change24h).toFixed(2)}%
                    </div>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          {onSend && (
            <Button className="flex-1" onClick={onSend}>
              <ArrowUpRight className="h-4 w-4 mr-2" />
              Send
            </Button>
          )}
          {onReceive && (
            <Button className="flex-1" variant="outline" onClick={onReceive}>
              <ArrowDownRight className="h-4 w-4 mr-2" />
              Receive
            </Button>
          )}
          {onRefresh && (
            <Button
              variant="outline"
              size="icon"
              onClick={handleRefresh}
              disabled={isRefreshing}
            >
              <RefreshCw className={cn(
                "h-4 w-4",
                isRefreshing && "animate-spin"
              )} />
            </Button>
          )}
        </div>
      </div>
    );
  }

  // Card variant (default)
  return (
    <Card className={className}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            Wallet
          </CardTitle>
          
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setHideBalances(!hideBalances)}
            >
              {hideBalances ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
            </Button>
            
            {onRefresh && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={handleRefresh}
                disabled={isRefreshing}
              >
                <RefreshCw className={cn(
                  "h-4 w-4",
                  isRefreshing && "animate-spin"
                )} />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Address */}
        {address && (
          <div className="flex items-center justify-between p-2 rounded-lg bg-muted">
            <span className="text-sm text-muted-foreground">Address</span>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 font-mono"
              onClick={handleCopyAddress}
            >
              {copied ? (
                <CheckCircle className="h-3.5 w-3.5 mr-2 text-green-500" />
              ) : (
                <Copy className="h-3.5 w-3.5 mr-2" />
              )}
              {formatAddress(address)}
            </Button>
          </div>
        )}
        
        {/* Main Balance */}
        {mainToken && (
          <div className="text-center py-2">
            {isLoading ? (
              <Skeleton className="h-8 w-24 mx-auto" />
            ) : (
              <>
                <div className="text-2xl font-bold">
                  {hideBalances ? '••••••' : `${formatBalance(mainToken.balance, mainToken.decimals)} ${mainToken.symbol}`}
                </div>
                {showUsdValues && mainToken.usdValue !== undefined && (
                  <div className="text-sm text-muted-foreground">
                    {hideBalances ? '••••' : formatUsd(mainToken.usdValue)}
                  </div>
                )}
              </>
            )}
          </div>
        )}
        
        {/* Other Tokens */}
        {otherTokens.length > 0 && (
          <div className="space-y-2">
            <div className="text-xs font-medium text-muted-foreground">OTHER TOKENS</div>
            {otherTokens.slice(0, 3).map(token => (
              <div key={token.symbol} className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{token.symbol}</span>
                <span className="font-medium">
                  {hideBalances ? '•••' : formatBalance(token.balance, token.decimals)}
                </span>
              </div>
            ))}
            {otherTokens.length > 3 && (
              <Button variant="ghost" size="sm" className="w-full">
                View all ({otherTokens.length} tokens)
              </Button>
            )}
          </div>
        )}
        
        {/* Actions */}
        <div className="flex gap-2 pt-2">
          {onSend && (
            <Button size="sm" className="flex-1" onClick={onSend}>
              <ArrowUpRight className="h-3.5 w-3.5 mr-1" />
              Send
            </Button>
          )}
          {onReceive && (
            <Button size="sm" variant="outline" className="flex-1" onClick={onReceive}>
              <ArrowDownRight className="h-3.5 w-3.5 mr-1" />
              Receive
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default WalletBalanceWidget;