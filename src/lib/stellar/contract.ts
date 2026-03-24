// ─── stellar/contract.ts ──────────────────────────────────────────────────────
// Typed factory helpers for Stellar / Soroban contracts.
// Import from here rather than constructing objects inline in components.

import { WalletNetwork } from '@creit.tech/stellar-wallets-kit'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface StellarContract {
  address: string
  network: WalletNetwork
}

// ─── Factory ──────────────────────────────────────────────────────────────────

/**
 * Creates a typed StellarContract descriptor.
 *
 * @param address  Soroban contract address (e.g. CAENNM2HH...)
 * @param network  The Stellar network to use (defaults to TESTNET)
 */
export function createStellarContract(
  address: string,
  network: WalletNetwork = WalletNetwork.TESTNET
): StellarContract {
  return { address, network }
}
