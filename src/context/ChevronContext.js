import { createContext, useContext } from 'react';

export const ChevronContext = createContext(null);
export const useChevron = () => useContext(ChevronContext);