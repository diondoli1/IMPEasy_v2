'use client';

import React, { createContext, useContext } from 'react';

import type { AuthUser } from '../types/auth';

type AuthContextValue = {
  user: AuthUser | null;
};

const AuthContext = createContext<AuthContextValue>({ user: null });

export function useAuth(): AuthContextValue {
  return useContext(AuthContext);
}

export const AuthContextProvider = AuthContext.Provider;
