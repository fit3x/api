import { describe, expect, it } from 'vitest'

import { etagFragment, searchParamsToRecord } from './query'

describe('searchParamsToRecord', () => {
  it('keeps a single value as a scalar', () => {
    const out = searchParamsToRecord(new URLSearchParams('locale=en&gender=male'))
    expect(out).toEqual({ gender: 'male', locale: 'en' })
  })

  it('collapses a repeated key to an array instead of dropping values', () => {
    const out = searchParamsToRecord(
      new URLSearchParams('goals=build_muscle&goals=lose_fat'),
    )
    expect(out.goals).toEqual(['build_muscle', 'lose_fat'])
  })

  it('handles an empty query', () => {
    expect(searchParamsToRecord(new URLSearchParams(''))).toEqual({})
  })

  it('preserves an empty-string value', () => {
    expect(searchParamsToRecord(new URLSearchParams('locale='))).toEqual({
      locale: '',
    })
  })
})

describe('etagFragment', () => {
  it('never emits a quote that would break the quoted ETag', () => {
    const fragment = etagFragment({ gender: 'male', goals: ['build_muscle'] })
    expect(fragment).not.toContain('"')
    // The whole header value must stay a single valid quoted-string.
    expect(`"programs-1.3.0-en-${fragment}"`).toMatch(/^"[^"]*"$/)
  })

  it('distinguishes different filter sets', () => {
    expect(etagFragment({ gender: 'male' })).not.toBe(
      etagFragment({ gender: 'female' }),
    )
  })

  it('handles no filters', () => {
    expect(etagFragment({})).toBe('%7B%7D')
  })
})
