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

function formatDateTime(): string {
  const now = new Date();
  return now.toLocaleString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function BellIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  );
}

function UserIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

function HelpIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
      <path d="M12 17h.01" />
    </svg>
  );
}

function CheckSquareIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M9 11l3 3L22 4" />
      <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
    </svg>
  );
}

function ChevronDownIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

export function AppShell({ children }: AppShellProps): JSX.Element {
  const pathname = usePathname();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [dateTime, setDateTime] = useState(formatDateTime());

  useEffect(() => {
    const interval = setInterval(() => setDateTime(formatDateTime()), 60_000);
    return () => clearInterval(interval);
  }, []);

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
      {/* Top Header Bar - MRPeasy style: light grey, logo, version, date/time | company, user, icons */}
      <header className="app-shell__top-bar">
        <div className="app-shell__top-bar-inner">
          <div className="app-shell__top-bar-left">
            <Link
              href={isAuthenticated ? getLandingPath(currentUser?.roles ?? []) : '/login'}
              className="app-shell__logo"
            >
              IMPeasy
            </Link>
            <span className="app-shell__version">v0.1</span>
            <span className="app-shell__datetime">{dateTime}</span>
          </div>

          {isAuthenticated && currentUser ? (
            <div className="app-shell__top-bar-right">
              <div className="app-shell__company-switcher">
                <span className="app-shell__company-plus">+</span>
                <span className="app-shell__company-name">MySampleCompany Inc.</span>
                <ChevronDownIcon className="app-shell__chevron" />
              </div>
              <div className="app-shell__user-info">
                <span className="app-shell__user-name">
                  {currentUser.name || (currentUser.email?.split('@')[0] ?? 'User')}
                </span>
                {normalizedRoles.length > 0 ? (
                  <div className="app-shell__role-row">
                    {normalizedRoles.map((role) => (
                      <Badge key={role} tone="info">
                        {role}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <Badge tone="warning">No mapped role</Badge>
                )}
              </div>
              <button
                type="button"
                className="app-shell__icon-btn"
                aria-label="Notifications"
                title="Notifications"
              >
                <BellIcon className="app-shell__icon" />
              </button>
              <button
                type="button"
                className="app-shell__icon-btn app-shell__icon-btn--profile"
                aria-label="Profile"
                title="Profile"
              >
                <UserIcon className="app-shell__icon" />
              </button>
              <button
                type="button"
                onClick={handleLogout}
                className="app-shell__logout-btn"
              >
                Log out
              </button>
              <div className="app-shell__top-bar-actions">
                <button
                  type="button"
                  className="app-shell__icon-btn app-shell__icon-btn--accent"
                  aria-label="Help"
                  title="Help"
                >
                  <HelpIcon className="app-shell__icon" />
                </button>
                <button
                  type="button"
                  className="app-shell__icon-btn app-shell__icon-btn--accent"
                  aria-label="Status"
                  title="Status"
                >
                  <CheckSquareIcon className="app-shell__icon" />
                </button>
              </div>
            </div>
          ) : null}
        </div>
      </header>

      {/* Secondary Navigation Bar - Module tabs (Customer Orders, Production, etc.) */}
      {isAuthenticated && currentUser ? (
        <nav className="app-shell__module-nav" aria-label="Module navigation">
          <div className="app-shell__module-nav-inner">
            {visibleGroups.map((group) => {
              const isActive = activeGroup?.key === group.key;

              return (
                <Link
                  key={group.key}
                  href={group.href}
                  className={`app-shell__module-link${isActive ? ' app-shell__module-link--active' : ''}`}
                >
                  {group.label}
                </Link>
              );
            })}
          </div>
        </nav>
      ) : null}

      {/* Tertiary Navigation - Context tabs (Board, Customers, Dashboard, etc.) */}
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
