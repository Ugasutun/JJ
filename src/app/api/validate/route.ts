// ─── app/api/validate/route.ts ─────────────────────────────────────────────────
// POST /api/validate — server-side final gate before any transaction is signed.
// Runs the same validation logic used on the client to prevent manipulation.

import { NextRequest, NextResponse } from 'next/server'
import { validateBatch, DustBalanceInput } from '@/lib/validation'

interface ValidateRequestBody {
  dustBalances: DustBalanceInput[]
}

export async function POST(request: NextRequest) {
  try {
    const body: ValidateRequestBody = await request.json()

    if (!body || !Array.isArray(body.dustBalances)) {
      return NextResponse.json(
        { valid: false, errors: ['Invalid request body: dustBalances array is required.'] },
        { status: 400 }
      )
    }

    // Server-side re-validation (mirrors the frontend validateBatch call)
    const result = validateBatch(body.dustBalances)

    if (!result.valid) {
      return NextResponse.json(
        { valid: false, errors: result.errors },
        { status: 422 }
      )
    }

    return NextResponse.json({ valid: true })
  } catch (err) {
    console.error('[/api/validate] Unexpected error:', err)
    return NextResponse.json(
      { valid: false, errors: ['Server validation error. Please try again.'] },
      { status: 500 }
    )
  }
}
