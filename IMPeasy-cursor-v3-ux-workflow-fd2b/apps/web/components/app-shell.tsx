'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import React, { useEffect, useState } from 'react';
import type { ReactNode } from 'react';

import { getCurrentUser } from '../lib/api';
import { clearAuthToken, getAuthToken } from '../lib/auth-storage';
import { AuthContextProvider } from '../lib/auth-context';
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
import { ModuleThumbnails } from './module-thumbnails';

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
  const isDashboard = pathname === '/dashboard';

  return (
    <AuthContextProvider value={{ user: currentUser }}>
      <div className="app-shell">
        <header className="app-shell__banner">
        <div className="app-shell__banner-inner">
          <div className="app-shell__brand-row">
            <div className="app-shell__brand">
              <Link href={isAuthenticated ? (isDashboard ? '/dashboard' : getLandingPath(currentUser?.roles ?? [])) : '/login'}>
                <span className="app-shell__brand-mark">IMPeasy</span>
              </Link>
              {!isDashboard ? (
                <span className="app-shell__brand-copy">Lean manufacturing operations</span>
              ) : null}
            </div>

            {isAuthenticated && currentUser ? (
              <div className="app-shell__identity">
                <div className="app-shell__identity-copy">
                  {isDashboard ? (
                    <div className="app-shell__identity-value">{currentUser.name}</div>
                  ) : (
                    <>
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
                    </>
                  )}
                </div>
                <button type="button" onClick={handleLogout} className="button button--secondary" aria-label="Log out">
                  {isDashboard ? (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                      <polyline points="16 17 21 12 16 7" />
                      <line x1="21" y1="12" x2="9" y2="12" />
                    </svg>
                  ) : (
                    'Log out'
                  )}
                </button>
              </div>
            ) : null}
          </div>

          {isAuthenticated && currentUser && !isDashboard ? (
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

      {isAuthenticated && currentUser && !isDashboard ? (
        <ModuleThumbnails roles={currentUser.roles} />
      ) : null}

      {isAuthenticated && currentUser && visibleTabs.length > 0 && !isDashboard ? (
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
    </AuthContextProvider>
  );
}
