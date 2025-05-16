import { GlobalRegistrator } from '@happy-dom/global-registrator';

GlobalRegistrator.register();
Reflect.set(globalThis, 'IS_REACT_ACT_ENVIRONMENT', true);
