import { Hono } from 'hono'
import { describe, expect, it } from 'vitest'

import { applyCoreMiddleware } from '../../middleware'
import type { AppEnv, Bindings } from '../../types/app'
import { optionsRoutes } from './options'

const PROJECT_URL = 'https://test.supabase.co'

const buildApp = () => {
  const app = new Hono<AppEnv>()
  applyCoreMiddleware(app)
  app.route('/v1', optionsRoutes)
  return app
}

const callOptions = async (
  path = '/v1/options',
  init: RequestInit = {},
): Promise<Response> => {
  const app = buildApp()
  const env: Bindings = { SUPABASE_PROJECT_URL: PROJECT_URL }
  return app.request(path, init, env)
}

describe('GET /v1/options', () => {
  it('returns 200 without an Authorization header (public route)', async () => {
    const res = await callOptions()
    expect(res.status).toBe(200)
    const body = (await res.json()) as Record<string, unknown>
    expect(Array.isArray(body.goals)).toBe(true)
  })

  it('returns 400 when locale is unsupported', async () => {
    const res = await callOptions('/v1/options?locale=zz')
    expect(res.status).toBe(400)
    const body = (await res.json()) as { error?: { code?: string } }
    expect(body.error?.code).toBe('bad_request')
  })

  it('returns 200 with all 11 option lists when no locale is given (default en)', async () => {
    const res = await callOptions('/v1/options')
    expect(res.status).toBe(200)
    const body = (await res.json()) as Record<string, unknown>
    expect(Array.isArray(body.goals)).toBe(true)
    expect((body.goals as unknown[]).length).toBeGreaterThan(0)
    const goal0 = (body.goals as Array<{ value: string; label: string }>)[0]
    expect(typeof goal0.value).toBe('string')
    expect(typeof goal0.label).toBe('string')
    expect(typeof body.requestId).toBe('string')
    expect(Array.isArray(body.muscles)).toBe(true)
    const muscle0 = (
      body.muscles as Array<{ value: string; label: string; simple_label: string }>
    )[0]
    expect(typeof muscle0.simple_label).toBe('string')
    // v1.3.0 dropped blockTypes/excludableBlocks (v3 has no session blocks)
    // and added intensities.
    const expectedKeys = [
      'biologicalSexes',
      'bodyParts',
      'conditions',
      'equipment',
      'experienceLevels',
      'goals',
      'injuries',
      'intensities',
      'movementPatterns',
      'muscles',
      'setTypes',
    ]
    for (const k of expectedKeys) {
      expect(Array.isArray(body[k])).toBe(true)
    }
    expect(body).not.toHaveProperty('blockTypes')
    expect(body).not.toHaveProperty('excludableBlocks')

    // The v3 goal vocabulary is exactly four.
    expect((body.goals as Array<{ value: string }>).map((g) => g.value)).toEqual([
      'get_stronger',
      'build_muscle',
      'lose_fat',
      'improve_general_fitness',
    ])
    // constraints.body_parts is the 11-value body-part vocabulary.
    const bodyParts = body.bodyParts as Array<{ value: string }>
    expect(bodyParts.length).toBe(11)
    // gluteus landed in engine 1.3.6 — data catalog and input vocabulary both.
    expect(bodyParts.map((b) => b.value)).toContain('gluteus')
  })

  it.each(['en', 'es', 'pt-BR', 'fr'])(
    'returns 200 with a stable value-ordered list for locale=%s',
    async (locale) => {
      const res = await callOptions(`/v1/options?locale=${locale}`)
      expect(res.status).toBe(200)
      const body = (await res.json()) as {
        goals: Array<{ value: string; label: string }>
      }
      expect(body.goals.length).toBeGreaterThan(0)
      for (const opt of body.goals) {
        expect(typeof opt.value).toBe('string')
        expect(typeof opt.label).toBe('string')
        expect(opt.label.length).toBeGreaterThan(0)
      }
    },
  )
})
