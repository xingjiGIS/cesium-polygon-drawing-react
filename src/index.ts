import logger from 'loglevel';
import { Aarav } from './core/Aarav';
import render from './render';

const aarav = new Aarav();

aarav.start();
try {
  render(aarav);
} catch (e) {
  logger.error(e);
}
