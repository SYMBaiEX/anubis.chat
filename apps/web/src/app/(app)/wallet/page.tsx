'use client';

import { AnimatePresence, motion } from 'framer-motion';
import {
  AlertTriangle,
  RefreshCcw,
  Shield,
  Sparkles,
  UserCheck,
  Wallet,
  Zap,
} from 'lucide-react';
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
      animate={{ opacity: 1 }}
      className="w-full bg-gradient-to-b from-primary/5 dark:from-primary/10"
      initial={{ opacity: 0 }}
      transition={{ duration: 0.6 }}
    >
      {/* Full-width header */}
      <div className="w-full p-4 md:p-6">
        <div className="mx-auto w-full max-w-6xl">
          <motion.div
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-1 gap-2 md:grid-cols-[1fr_auto] md:items-center"
            initial={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <motion.div
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-3"
              initial={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.4, delay: 0.2 }}
            >
              <motion.div
                animate={{
                  rotate: [0, 360],
                  scale: [1, 1.1, 1],
                }}
                transition={{
                  rotate: {
                    duration: 4,
                    repeat: Number.POSITIVE_INFINITY,
                    ease: 'linear',
                  },
                  scale: {
                    duration: 2,
                    repeat: Number.POSITIVE_INFINITY,
                    ease: 'easeInOut',
                  },
                }}
              >
                <Wallet className="h-6 w-6 text-primary sm:h-8 sm:w-8" />
              </motion.div>
              <div>
                <motion.h1
                  animate={{ opacity: 1, x: 0 }}
                  className="bg-gradient-to-r from-primary via-foreground to-primary bg-clip-text font-semibold text-2xl text-transparent sm:text-3xl"
                  initial={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.4, delay: 0.3 }}
                >
                  Wallet
                </motion.h1>
                <motion.p
                  animate={{ opacity: 1, x: 0 }}
                  className="text-muted-foreground text-sm"
                  initial={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.4, delay: 0.4 }}
                >
                  Connect and manage your Solana wallet
                </motion.p>
              </div>
            </motion.div>
            <motion.div
              animate={{ opacity: 1, x: 0 }}
              className="flex md:justify-end"
              initial={{ opacity: 0, x: 10 }}
              transition={{ duration: 0.4, delay: 0.3 }}
            >
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Badge
                  className="relative overflow-hidden"
                  variant={isConnected ? 'default' : 'secondary'}
                >
                  {isConnected && (
                    <motion.div
                      animate={{ x: [-100, 100] }}
                      className="absolute inset-0 bg-gradient-to-r from-transparent via-green-400/20 to-transparent"
                      transition={{
                        duration: 2,
                        repeat: Number.POSITIVE_INFINITY,
                        repeatType: 'loop',
                        ease: 'linear',
                      }}
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
        animate={{ opacity: 1, y: 0 }}
        className="mx-auto mt-3 w-full max-w-6xl px-3 sm:px-4 md:px-6"
        initial={{ opacity: 0, y: 20 }}
        transition={{ duration: 0.5, delay: 0.5 }}
      >
        <motion.div
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          whileHover={{ scale: 1.01 }}
        >
          <Card className="relative overflow-hidden p-3 sm:p-4 md:p-6">
            <motion.div
              animate={{ x: [-100, 100] }}
              className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/5 to-transparent"
              transition={{
                duration: 4,
                repeat: Number.POSITIVE_INFINITY,
                repeatType: 'loop',
                ease: 'linear',
              }}
            />
            <div className="relative z-10">
              <AnimatePresence mode="wait">
                {isConnected ? (
                  <motion.div
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-4"
                    exit={{ opacity: 0, y: -10 }}
                    initial={{ opacity: 0, y: 10 }}
                    key="connected"
                    transition={{ duration: 0.3 }}
                  >
                    <motion.div
                      animate={{ opacity: 1 }}
                      className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
                      initial={{ opacity: 0 }}
                      transition={{ delay: 0.1 }}
                    >
                      <motion.div
                        animate={{ opacity: 1, x: 0 }}
                        className="min-w-0 space-y-1"
                        initial={{ opacity: 0, x: -10 }}
                        transition={{ delay: 0.2 }}
                      >
                        <div className="flex items-center gap-2">
                          <motion.div
                            animate={{ scale: [1, 1.1, 1] }}
                            transition={{
                              duration: 2,
                              repeat: Number.POSITIVE_INFINITY,
                              ease: 'easeInOut',
                            }}
                          >
                            <Zap className="h-4 w-4 text-green-500" />
                          </motion.div>
                          <p className="font-medium text-muted-foreground text-xs">
                            Wallet Address
                          </p>
                        </div>
                        <p
                          className="truncate font-mono text-sm"
                          title={address}
                        >
                          {formatSolanaAddress(address, 8)}
                        </p>
                      </motion.div>

                      <motion.div
                        animate={{ opacity: 1, scale: 1 }}
                        className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3 md:grid-cols-3"
                        initial={{ opacity: 0, scale: 0.95 }}
                        transition={{ delay: 0.3 }}
                      >
                        <motion.div
                          className="relative overflow-hidden rounded-md border p-2"
                          whileHover={{ scale: 1.02 }}
                        >
                          <motion.div
                            animate={{ x: [-50, 50] }}
                            className="absolute inset-0 bg-gradient-to-r from-transparent via-blue-400/10 to-transparent"
                            transition={{
                              duration: 3,
                              repeat: Number.POSITIVE_INFINITY,
                              repeatType: 'loop',
                              ease: 'linear',
                            }}
                          />
                          <div className="relative z-10">
                            <div className="flex items-center gap-1">
                              <Sparkles className="h-3 w-3 text-blue-500" />
                              <p className="font-medium text-[10px] text-muted-foreground uppercase">
                                Balance
                              </p>
                            </div>
                            <p className="font-semibold text-sm">
                              {Number(balance ?? 0).toFixed(4)} SOL
                            </p>
                          </div>
                        </motion.div>

                        <motion.div
                          className="relative overflow-hidden rounded-md border p-2"
                          whileHover={{ scale: 1.02 }}
                        >
                          <motion.div
                            animate={{ x: [-50, 50] }}
                            className="absolute inset-0 bg-gradient-to-r from-transparent via-green-400/10 to-transparent"
                            transition={{
                              duration: 2.5,
                              repeat: Number.POSITIVE_INFINITY,
                              repeatType: 'loop',
                              ease: 'linear',
                              delay: 0.5,
                            }}
                          />
                          <div className="relative z-10">
                            <div className="flex items-center gap-1">
                              <Shield className="h-3 w-3 text-green-500" />
                              <p className="font-medium text-[10px] text-muted-foreground uppercase">
                                Health
                              </p>
                            </div>
                            <p className="font-semibold text-sm">
                              {isHealthy ? 'Good' : 'Degraded'}
                            </p>
                          </div>
                        </motion.div>

                        <motion.div
                          className="relative overflow-hidden rounded-md border p-2"
                          whileHover={{ scale: 1.02 }}
                        >
                          <motion.div
                            animate={{ x: [-50, 50] }}
                            className="absolute inset-0 bg-gradient-to-r from-transparent via-purple-400/10 to-transparent"
                            transition={{
                              duration: 2,
                              repeat: Number.POSITIVE_INFINITY,
                              repeatType: 'loop',
                              ease: 'linear',
                              delay: 1,
                            }}
                          />
                          <div className="relative z-10">
                            <div className="flex items-center gap-1">
                              <UserCheck className="h-3 w-3 text-purple-500" />
                              <p className="font-medium text-[10px] text-muted-foreground uppercase">
                                Auth
                              </p>
                            </div>
                            <p className="font-semibold text-sm">
                              {isAuthenticated ? 'Signed in' : 'Guest'}
                            </p>
                          </div>
                        </motion.div>
                      </motion.div>
                    </motion.div>

                    <motion.div
                      animate={{ opacity: 1, y: 0 }}
                      className="flex flex-wrap gap-2"
                      initial={{ opacity: 0, y: 10 }}
                      transition={{ delay: 0.4 }}
                    >
                      <motion.div
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <Button
                          className="relative overflow-hidden"
                          onClick={refreshBalance}
                          size="sm"
                          type="button"
                          variant="secondary"
                        >
                          <motion.div
                            animate={{ rotate: 360 }}
                            className="mr-2"
                            transition={{ duration: 1, ease: 'easeInOut' }}
                          >
                            <RefreshCcw className="h-3 w-3" />
                          </motion.div>
                          Refresh balance
                        </Button>
                      </motion.div>
                      <AnimatePresence>
                        {!isAuthenticated && (
                          <motion.div
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.8 }}
                            initial={{ opacity: 0, scale: 0.8 }}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                          >
                            <Button
                              className="relative overflow-hidden"
                              onClick={authenticateWithConvex}
                              size="sm"
                              type="button"
                            >
                              <motion.div
                                animate={{ x: [-100, 100] }}
                                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                                transition={{
                                  duration: 2,
                                  repeat: Number.POSITIVE_INFINITY,
                                  repeatType: 'loop',
                                  ease: 'linear',
                                }}
                              />
                              <UserCheck className="relative z-10 mr-2 h-3 w-3" />
                              <span className="relative z-10">
                                Authenticate
                              </span>
                            </Button>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  </motion.div>
                ) : (
                  <motion.div
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-4"
                    exit={{ opacity: 0, y: -10 }}
                    initial={{ opacity: 0, y: 10 }}
                    key="disconnected"
                    transition={{ duration: 0.3 }}
                  >
                    <motion.div
                      animate={{ opacity: 1 }}
                      className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
                      initial={{ opacity: 0 }}
                      transition={{ delay: 0.1 }}
                    >
                      <motion.div
                        animate={{ opacity: 1, x: 0 }}
                        className="space-y-2"
                        initial={{ opacity: 0, x: -10 }}
                        transition={{ delay: 0.2 }}
                      >
                        <div className="flex items-center gap-2">
                          <motion.div
                            animate={{ scale: [1, 1.2, 1] }}
                            transition={{
                              duration: 2,
                              repeat: Number.POSITIVE_INFINITY,
                              ease: 'easeInOut',
                            }}
                          >
                            <Wallet className="h-5 w-5 text-primary" />
                          </motion.div>
                          <h2 className="font-semibold text-lg">
                            Connect your wallet
                          </h2>
                        </div>
                        <p className="text-muted-foreground text-sm">
                          Use your Solana wallet to authenticate and manage
                          payments.
                        </p>
                      </motion.div>

                      <motion.div
                        animate={{ opacity: 1, x: 0 }}
                        className="flex flex-wrap items-center gap-3"
                        initial={{ opacity: 0, x: 10 }}
                        transition={{ delay: 0.3 }}
                      >
                        <motion.div
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          <Button
                            className="relative overflow-hidden"
                            disabled={isConnecting}
                            onClick={connect}
                            size="default"
                            type="button"
                          >
                            {isConnecting && (
                              <motion.div
                                animate={{ x: [-100, 100] }}
                                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                                transition={{
                                  duration: 1.5,
                                  repeat: Number.POSITIVE_INFINITY,
                                  repeatType: 'loop',
                                  ease: 'linear',
                                }}
                              />
                            )}
                            <span className="relative z-10">
                              {isConnecting ? 'Connecting…' : 'Connect'}
                            </span>
                          </Button>
                        </motion.div>
                        <motion.div
                          animate={{ opacity: 1, scale: 1 }}
                          initial={{ opacity: 0, scale: 0.8 }}
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
                          animate={{ opacity: 1, height: 'auto', y: 0 }}
                          className="overflow-hidden"
                          exit={{ opacity: 0, height: 0, y: -10 }}
                          initial={{ opacity: 0, height: 0, y: -10 }}
                          transition={{ duration: 0.3 }}
                        >
                          <motion.div
                            className="flex items-center gap-2 rounded-md border border-red-200 bg-red-50 p-3 dark:border-red-800 dark:bg-red-900/20"
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
                              className="text-red-800 text-sm dark:text-red-200"
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
