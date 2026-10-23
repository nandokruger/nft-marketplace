import { http, HttpResponse } from 'msw';
import { dbManager } from '../db';
import { scenarioManager } from '../scenarios';
import { ScenarioTypeSchema } from '@/contracts';

export const testHandlers = [
  http.post('/api/__test__/reset', async () => {
    dbManager.reset();
    scenarioManager.reset();
    return HttpResponse.json({ success: true, message: 'Database reset to initial deterministic seed.' });
  }),

  http.post('/api/__test__/scenario', async ({ request }) => {
    const body = (await request.json()) as { scenario: string };
    const parsed = ScenarioTypeSchema.safeParse(body?.scenario);
    if (!parsed.success) {
      return HttpResponse.json(
        { error: 'BAD_REQUEST', message: `Cenário desconhecido: ${body?.scenario}` },
        { status: 400 }
      );
    }
    scenarioManager.setScenario(parsed.data);
    return HttpResponse.json({
      success: true,
      activeScenario: parsed.data
    });
  }),

  http.get('/api/__test__/scenario', async () => {
    const current = scenarioManager.getScenario();
    return HttpResponse.json({
      activeScenario: current
    });
  })
];
