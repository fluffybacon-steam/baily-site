import { createContext, useContext } from 'react';

/**
 * Provides the globally shared ChevronScene and its transition Chevron to any
 * component in the tree.  Both values are React refs so consumers always read
 * the live instance without triggering re-renders.
 *
 * @typedef {{ sceneRef: React.RefObject, chevronRef: React.RefObject }} ChevronSceneContextValue
 */
export const ChevronSceneContext = createContext({ sceneRef: null, chevronRef: null });

/** Convenience hook — returns { sceneRef, chevronRef } directly. */
export const useChevronScene = () => useContext(ChevronSceneContext);