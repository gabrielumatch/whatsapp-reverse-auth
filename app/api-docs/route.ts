/* eslint-disable @typescript-eslint/no-explicit-any */
import { ApiReference } from '@scalar/nextjs-api-reference'

export const GET = ApiReference({
  spec: {
    url: '/openapi.json',
  },
} as any)