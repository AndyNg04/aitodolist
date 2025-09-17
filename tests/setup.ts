import { beforeEach } from 'vitest';
import { resetDatabase } from '../src/server/db/testUtils';

resetDatabase();

beforeEach(() => {
  resetDatabase();
});
