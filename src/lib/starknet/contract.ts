// ─── starknet/contract.ts ─────────────────────────────────────────────────────
// Typed factory helper for StarkNet ERC-20 contracts.
// Keeps contract construction out of component files.

import { Contract, RpcProvider } from 'starknet'

// ─── Minimal ERC-20 ABI ───────────────────────────────────────────────────────

export const ERC20_ABI = [
  {
    name: 'balanceOf',
    type: 'function',
    inputs: [{ name: 'account', type: 'felt' }],
    outputs: [{ name: 'balance', type: 'Uint256' }],
  },
] as const

// ─── Types ────────────────────────────────────────────────────────────────────

export interface StarknetContract {
  balanceOf: (address: string) => Promise<{ balance: unknown }>
}

// ─── Factory ──────────────────────────────────────────────────────────────────

/**
 * Creates a StarkNet ERC-20 contract instance for a given token address.
 *
 * @param tokenAddress  The on-chain token contract address (0x...)
 * @param provider      An RpcProvider instance connected to the desired network
 */
export function createStarknetContract(
  tokenAddress: string,
  provider: RpcProvider
): StarknetContract {
  return new Contract(ERC20_ABI as never, tokenAddress, provider) as unknown as StarknetContract
}
