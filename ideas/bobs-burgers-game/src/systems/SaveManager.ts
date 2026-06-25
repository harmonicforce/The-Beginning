/**
 * SaveManager.ts — Layer 0
 * No-op save manager. Schema defined; persistence deferred post-MVP.
 */

import { SaveSchema, EMPTY_SAVE } from './SaveSchema';

export const SaveManager = {
  load(): SaveSchema {
    // MVP: return defaults. Wire localStorage here post-prototype.
    return structuredClone(EMPTY_SAVE);
  },

  save(_schema: SaveSchema): void {
    // MVP: no-op. localStorage.setItem('bobs_save', JSON.stringify(schema));
  },
};
