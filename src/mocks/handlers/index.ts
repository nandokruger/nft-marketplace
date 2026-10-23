import { authHandlers } from './auth';
import { catalogHandlers } from './catalog';
import { cartHandlers } from './cart';
import { orderHandlers } from './order';
import { walletHandlers } from './wallet';
import { testHandlers } from './test';
import { socketHandlers } from '../socket-handlers';

export const handlers = [
  ...socketHandlers,
  ...authHandlers,
  ...catalogHandlers,
  ...cartHandlers,
  ...orderHandlers,
  ...walletHandlers,
  ...testHandlers
];
