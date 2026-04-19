import { createContext, useContext } from 'react';

/**
 * Provides the globally shared RenderScene and its transition Chevron to any
 * component in the tree.  Both values are React refs so consumers always read
 * the live instance without triggering re-renders.
 *
 * @typedef {{ sceneRef: React.RefObject, chevronRef: React.RefObject }} RenderSceneContextValue
 */
export const RenderSceneContext = createContext({ sceneRef: null, chevronRef: null });

/** Convenience hook — returns { sceneRef, chevronRef } directly. */
export const useRenderScene = () => useContext(RenderSceneContext);