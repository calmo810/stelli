// Lets the Deno backend code be imported under Node for tests: the two
// Base44-only module names are pointed at small stand-ins.
import { register } from 'node:module';

register('./loader.mjs', import.meta.url);
