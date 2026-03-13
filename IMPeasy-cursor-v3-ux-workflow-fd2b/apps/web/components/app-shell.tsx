'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import React, { useEffect, useState } from 'react';
import type { ReactNode } from 'react';

import { getCurrentUser } from '../lib/api';
import { clearAuthToken, getAuthToken } from '../lib/auth-storage';
import {
  canAccessPath,
  getActiveNavigationGroup,
  getLandingPath,
  getVisibleNavigationGroups,
  getVisibleNavigationTabs,
  normalizeRoles,
} from '../lib/navigation';
import type { AuthUser } from '../types/auth';
import { Badge } from './ui/primitives';

type AppShellProps = {
  children: ReactNode;
};

export function AppShell({ children }: AppShellProps): JSX.Element {
  const pathname = usePathname();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    const authToken = getAuthToken();
    const authenticated = Boolean(authToken);
    const isLoginRoute = pathname === '/login';

    setIsAuthenticated(authenticated);

    if (!authenticated) {
      setCurrentUser(null);

      if (!isLoginRoute) {
        setIsLoading(true);
        router.replace('/login');
        return;
      }

      setIsLoading(false);
      return;
    }

    let isCancelled = false;
    setIsLoading(true);

    void (async () => {
      try {
        const user = await getCurrentUser();
        if (isCancelled) {
          return;
        }

        const landingPath = getLandingPath(user.roles);

        if (isLoginRoute) {
          router.replace(landingPath);
          return;
        }

        if (!canAccessPath(pathname, user.roles)) {
          router.replace(landingPath);
          return;
        }

        setCurrentUser(user);
        setIsLoading(false);
      } catch {
        if (isCancelled) {
          return;
        }

        clearAuthToken();
        setIsAuthenticated(false);
        setCurrentUser(null);

        if (!isLoginRoute) {
          router.replace('/login');
          return;
        }

        setIsLoading(false);
      }
    })();

    return () => {
      isCancelled = true;
    };
  }, [pathname, router]);

  const handleLogout = (): void => {
    clearAuthToken();
    setIsAuthenticated(false);
    setCurrentUser(null);
    setIsLoading(true);
    router.replace('/login');
  };

  const normalizedRoles = currentUser ? normalizeRoles(currentUser.roles) : [];
  const visibleGroups = currentUser ? getVisibleNavigationGroups(currentUser.roles) : [];
  const activeGroup = getActiveNavigationGroup(pathname);
  const visibleTabs = currentUser ? getVisibleNavigationTabs(pathname, currentUser.roles) : [];

  return (
    <div className="app-shell">
      <header className="app-shell__banner">
        <div className="app-shell__banner-inner">
          <div className="app-shell__brand-row">
            <div className="app-shell__brand">
              <Link href={isAuthenticated ? getLandingPath(currentUser?.roles ?? []) : '/login'}>
                <span className="app-shell__brand-mark">IMPeasy</span>
              </Link>
              <span className="app-shell__brand-copy">Lean manufacturing operations</span>
            </div>

            {isAuthenticated && currentUser ? (
              <div className="app-shell__identity">
                <div className="app-shell__identity-copy">
                  <div className="app-shell__identity-label">Signed in</div>
                  <div className="app-shell__identity-value">{currentUser.email}</div>
                  <div className="app-shell__role-row">
                    {normalizedRoles.length > 0 ? (
                      normalizedRoles.map((role) => (
                        <Badge key={role} tone="info">
                          {role}
                        </Badge>
                      ))
                    ) : (
                      <Badge tone="warning">No mapped role</Badge>
                    )}
                  </div>
                </div>
                <button type="button" onClick={handleLogout} className="button button--secondary">
                  Log out
                </button>
              </div>
            ) : null}
          </div>

          {isAuthenticated && currentUser ? (
            <nav className="app-shell__top-nav" aria-label="Primary navigation">
              {visibleGroups.map((group) => {
                const isActive = activeGroup?.key === group.key;

                return (
                  <Link
                    key={group.key}
                    href={group.href}
                    className={`app-shell__top-link${isActive ? ' app-shell__top-link--active' : ''}`}
                  >
                    {group.label}
                  </Link>
                );
              })}
            </nav>
          ) : null}
        </div>
      </header>

      {isAuthenticated && currentUser && visibleTabs.length > 0 ? (
        <div className="app-shell__subnav">
          <div className="app-shell__banner-inner app-shell__subnav-inner">
            <div className="app-shell__subnav-label">
              {activeGroup ? `${activeGroup.label} views` : 'Context'}
            </div>
            <div className="app-shell__subnav-links">
              {visibleTabs.map((tab) => {
                const isActive = pathname === tab.href || pathname.startsWith(`${tab.href}/`);

                return (
                  <Link
                    key={tab.href}
                    href={tab.href}
                    className={`app-shell__sub-link${isActive ? ' app-shell__sub-link--active' : ''}`}
                  >
                    {tab.label}
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      ) : null}

      <main className="app-shell__main">
        {isLoading ? (
          <div className="shell-state">
            <p>{pathname === '/login' ? 'Checking access...' : 'Loading workspace...'}</p>
          </div>
        ) : (
          children
        )}
      </main>
    </div>
  );
}
