import { delay, HttpResponse } from 'msw';
import type { ScenarioType } from '@/contracts';

const SCENARIO_STORAGE_KEY = '@jungle-nft:scenario';

class ScenarioManager {
  private activeScenario: ScenarioType = 'default';
  private outOfOrderCounter = 0;

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage() {
    if (typeof window === 'undefined') return;
    const urlParams = new URLSearchParams(window.location.search);
    const queryScenario = urlParams.get('__scenario') as ScenarioType | null;
    if (queryScenario) {
      this.activeScenario = queryScenario;
      return;
    }
    const stored = window.localStorage?.getItem(SCENARIO_STORAGE_KEY) as ScenarioType | null;
    if (stored) {
      this.activeScenario = stored;
    }
  }

  getScenario(): ScenarioType {
    return this.activeScenario;
  }

  setScenario(scenario: ScenarioType) {
    this.activeScenario = scenario;
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(SCENARIO_STORAGE_KEY, scenario);
    }
  }

  reset() {
    this.activeScenario = 'default';
    this.outOfOrderCounter = 0;
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.removeItem(SCENARIO_STORAGE_KEY);
    }
  }

  async handleChaos(request: Request, isPrivateAction = false): Promise<Response | null> {
    // 1. Header override takes priority
    const headerScenario = request.headers.get('x-scenario') as ScenarioType | null;
    const scenario = headerScenario || this.activeScenario;

    switch (scenario) {
      case 'slow-network':
        await delay(2500);
        return null;

      case 'out-of-order':
        this.outOfOrderCounter += 1;
        // First search request is slow (2000ms), subsequent is fast (100ms)
        if (this.outOfOrderCounter % 2 === 1) {
          await delay(2000);
        } else {
          await delay(100);
        }
        return null;

      case 'http-500':
      case 'network-error':
        await delay(200);
        return HttpResponse.json(
          {
            error: 'INTERNAL_SERVER_ERROR',
            message: 'Falha transitória na rede ou serviço de nós blockchain.'
          },
          { status: 500 }
        );

      case 'session-expired':
        if (isPrivateAction) {
          await delay(150);
          return HttpResponse.json(
            {
              error: 'UNAUTHORIZED',
              message: 'Sua sessão expirou. Por favor autentique-se novamente.'
            },
            { status: 401 }
          );
        }
        await delay(150);
        return null;

      case 'default':
      default:
        await delay(150);
        return null;
    }
  }
}

export const scenarioManager = new ScenarioManager();
