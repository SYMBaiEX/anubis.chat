'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Wallet, Zap, Shield, RefreshCcw, UserCheck, AlertTriangle, Sparkles } from 'lucide-react';
import { useAuthContext } from '@/components/providers/auth-provider';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { WalletConnectButton } from '@/components/wallet/wallet-connect-button';
import { useWallet } from '@/hooks/useWallet';
import { formatSolanaAddress } from '@/lib/solana';

export default function WalletPage() {
  const { isAuthenticated } = useAuthContext();
  const {
    isConnected,
    isConnecting,
    publicKey,
    balance,
    connect,
    authenticateWithConvex,
    refreshBalance,
    isHealthy,
    // connectionHealthScore,
    error,
  } = useWallet();

  const address = publicKey?.toString() ?? '';

  return (
    <motion.div 
      className="w-full bg-gradient-to-b from-primary/5 dark:from-primary/10"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
    >
      {/* Full-width header */}
      <div className="w-full p-4 md:p-6">
        <div className="mx-auto w-full max-w-6xl">
          <motion.div 
            className="grid grid-cols-1 gap-2 md:grid-cols-[1fr_auto] md:items-center"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <motion.div 
              className="flex items-center gap-3"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: 0.2 }}
            >
              <motion.div
                animate={{ 
                  rotate: [0, 360],
                  scale: [1, 1.1, 1]
                }}
                transition={{ 
                  rotate: { duration: 4, repeat: Infinity, ease: "linear" },
                  scale: { duration: 2, repeat: Infinity, ease: "easeInOut" }
                }}
              >
                <Wallet className="h-6 w-6 text-primary sm:h-8 sm:w-8" />
              </motion.div>
              <div>
                <motion.h1 
                  className="bg-gradient-to-r from-primary via-foreground to-primary bg-clip-text font-semibold text-2xl text-transparent sm:text-3xl"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4, delay: 0.3 }}
                >
                  Wallet
                </motion.h1>
                <motion.p 
                  className="text-muted-foreground text-sm"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4, delay: 0.4 }}
                >
                  Connect and manage your Solana wallet
                </motion.p>
              </div>
            </motion.div>
            <motion.div 
              className="flex md:justify-end"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: 0.3 }}
            >
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Badge variant={isConnected ? 'default' : 'secondary'} className="relative overflow-hidden">
                  {isConnected && (
                    <motion.div
                      animate={{ x: [-100, 100] }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        repeatType: "loop",
                        ease: "linear"
                      }}
                      className="absolute inset-0 bg-gradient-to-r from-transparent via-green-400/20 to-transparent"
                    />
                  )}
                  <span className="relative z-10">
                    {isConnected ? 'Connected' : 'Disconnected'}
                  </span>
                </Badge>
              </motion.div>
            </motion.div>
          </motion.div>
        </div>
      </div>

      {/* Constrained content */}
      <motion.div 
        className="mx-auto mt-3 w-full max-w-6xl px-3 sm:px-4 md:px-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.5 }}
      >
        <motion.div
          whileHover={{ scale: 1.01 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
        >
          <Card className="p-3 sm:p-4 md:p-6 relative overflow-hidden">
            <motion.div
              animate={{ x: [-100, 100] }}
              transition={{
                duration: 4,
                repeat: Infinity,
                repeatType: "loop",
                ease: "linear"
              }}
              className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/5 to-transparent"
            />
            <div className="relative z-10">
              <AnimatePresence mode="wait">
                {isConnected ? (
                  <motion.div 
                    className="space-y-4"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.3 }}
                    key="connected"
                  >
                    <motion.div 
                      className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.1 }}
                    >
                      <motion.div 
                        className="min-w-0 space-y-1"
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 }}
                      >
                        <div className="flex items-center gap-2">
                          <motion.div
                            animate={{ scale: [1, 1.1, 1] }}
                            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                          >
                            <Zap className="h-4 w-4 text-green-500" />
                          </motion.div>
                          <p className="text-muted-foreground text-xs font-medium">Wallet Address</p>
                        </div>
                        <p className="truncate font-mono text-sm" title={address}>
                          {formatSolanaAddress(address, 8)}
                        </p>
                      </motion.div>
                      
                      <motion.div 
                        className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3 md:grid-cols-3"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.3 }}
                      >
                        <motion.div 
                          className="rounded-md border p-2 relative overflow-hidden"
                          whileHover={{ scale: 1.02 }}
                        >
                          <motion.div
                            animate={{ x: [-50, 50] }}
                            transition={{
                              duration: 3,
                              repeat: Infinity,
                              repeatType: "loop",
                              ease: "linear"
                            }}
                            className="absolute inset-0 bg-gradient-to-r from-transparent via-blue-400/10 to-transparent"
                          />
                          <div className="relative z-10">
                            <div className="flex items-center gap-1">
                              <Sparkles className="h-3 w-3 text-blue-500" />
                              <p className="text-[10px] text-muted-foreground uppercase font-medium">
                                Balance
                              </p>
                            </div>
                            <p className="text-sm font-semibold">
                              {Number(balance ?? 0).toFixed(4)} SOL
                            </p>
                          </div>
                        </motion.div>
                        
                        <motion.div 
                          className="rounded-md border p-2 relative overflow-hidden"
                          whileHover={{ scale: 1.02 }}
                        >
                          <motion.div
                            animate={{ x: [-50, 50] }}
                            transition={{
                              duration: 2.5,
                              repeat: Infinity,
                              repeatType: "loop",
                              ease: "linear",
                              delay: 0.5
                            }}
                            className="absolute inset-0 bg-gradient-to-r from-transparent via-green-400/10 to-transparent"
                          />
                          <div className="relative z-10">
                            <div className="flex items-center gap-1">
                              <Shield className="h-3 w-3 text-green-500" />
                              <p className="text-[10px] text-muted-foreground uppercase font-medium">
                                Health
                              </p>
                            </div>
                            <p className="text-sm font-semibold">{isHealthy ? 'Good' : 'Degraded'}</p>
                          </div>
                        </motion.div>
                        
                        <motion.div 
                          className="rounded-md border p-2 relative overflow-hidden"
                          whileHover={{ scale: 1.02 }}
                        >
                          <motion.div
                            animate={{ x: [-50, 50] }}
                            transition={{
                              duration: 2,
                              repeat: Infinity,
                              repeatType: "loop",
                              ease: "linear",
                              delay: 1
                            }}
                            className="absolute inset-0 bg-gradient-to-r from-transparent via-purple-400/10 to-transparent"
                          />
                          <div className="relative z-10">
                            <div className="flex items-center gap-1">
                              <UserCheck className="h-3 w-3 text-purple-500" />
                              <p className="text-[10px] text-muted-foreground uppercase font-medium">
                                Auth
                              </p>
                            </div>
                            <p className="text-sm font-semibold">
                              {isAuthenticated ? 'Signed in' : 'Guest'}
                            </p>
                          </div>
                        </motion.div>
                      </motion.div>
                    </motion.div>

                    <motion.div 
                      className="flex flex-wrap gap-2"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4 }}
                    >
                      <motion.div
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <Button
                          onClick={refreshBalance}
                          size="sm"
                          type="button"
                          variant="secondary"
                          className="relative overflow-hidden"
                        >
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, ease: "easeInOut" }}
                            className="mr-2"
                          >
                            <RefreshCcw className="h-3 w-3" />
                          </motion.div>
                          Refresh balance
                        </Button>
                      </motion.div>
                      <AnimatePresence>
                        {!isAuthenticated && (
                          <motion.div
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.8 }}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                          >
                            <Button
                              onClick={authenticateWithConvex}
                              size="sm"
                              type="button"
                              className="relative overflow-hidden"
                            >
                              <motion.div
                                animate={{ x: [-100, 100] }}
                                transition={{
                                  duration: 2,
                                  repeat: Infinity,
                                  repeatType: "loop",
                                  ease: "linear"
                                }}
                                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                              />
                              <UserCheck className="mr-2 h-3 w-3 relative z-10" />
                              <span className="relative z-10">Authenticate</span>
                            </Button>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  </motion.div>
                ) : (
                  <motion.div 
                    className="space-y-4"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.3 }}
                    key="disconnected"
                  >
                    <motion.div 
                      className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.1 }}
                    >
                      <motion.div 
                        className="space-y-2"
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 }}
                      >
                        <div className="flex items-center gap-2">
                          <motion.div
                            animate={{ scale: [1, 1.2, 1] }}
                            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                          >
                            <Wallet className="h-5 w-5 text-primary" />
                          </motion.div>
                          <h2 className="font-semibold text-lg">Connect your wallet</h2>
                        </div>
                        <p className="text-muted-foreground text-sm">
                          Use your Solana wallet to authenticate and manage payments.
                        </p>
                      </motion.div>
                      
                      <motion.div 
                        className="flex flex-wrap items-center gap-3"
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.3 }}
                      >
                        <motion.div
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          <Button
                            disabled={isConnecting}
                            onClick={connect}
                            size="default"
                            type="button"
                            className="relative overflow-hidden"
                          >
                            {isConnecting && (
                              <motion.div
                                animate={{ x: [-100, 100] }}
                                transition={{
                                  duration: 1.5,
                                  repeat: Infinity,
                                  repeatType: "loop",
                                  ease: "linear"
                                }}
                                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                              />
                            )}
                            <span className="relative z-10">
                              {isConnecting ? 'Connecting…' : 'Connect'}
                            </span>
                          </Button>
                        </motion.div>
                        <motion.div
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: 0.4 }}
                          whileHover={{ scale: 1.02 }}
                        >
                          <WalletConnectButton />
                        </motion.div>
                      </motion.div>
                    </motion.div>
                    
                    <AnimatePresence>
                      {error && (
                        <motion.div
                          initial={{ opacity: 0, height: 0, y: -10 }}
                          animate={{ opacity: 1, height: "auto", y: 0 }}
                          exit={{ opacity: 0, height: 0, y: -10 }}
                          transition={{ duration: 0.3 }}
                          className="overflow-hidden"
                        >
                          <motion.div 
                            className="flex items-center gap-2 rounded-md border border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20 p-3"
                            whileHover={{ scale: 1.01 }}
                          >
                            <motion.div
                              animate={{ rotate: [0, 10, -10, 0] }}
                              transition={{ duration: 0.5 }}
                            >
                              <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400" />
                            </motion.div>
                            <p
                              aria-live="polite"
                              className="text-red-800 dark:text-red-200 text-sm"
                              role="alert"
                            >
                              {error}
                            </p>
                          </motion.div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </Card>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}
