'use client';

import { useRouter } from 'next/navigation';
import React, { FormEvent, useState } from 'react';

import { loginUser } from '../../lib/api';
import { setAuthToken } from '../../lib/auth-storage';
import { getLandingPath } from '../../lib/navigation';
import { Button, Field, FormGrid, Notice, Panel } from '../../components/ui/primitives';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function LoginPage(): JSX.Element {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validate = (): string | null => {
    if (!email.trim()) {
      return 'Email is required.';
    }

    if (!EMAIL_PATTERN.test(email.trim())) {
      return 'Email must be valid.';
    }

    if (!password) {
      return 'Password is required.';
    }

    if (password.length < 8) {
      return 'Password must be at least 8 characters.';
    }

    return null;
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    setError(null);

    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await loginUser({
        email: email.trim().toLowerCase(),
        password,
      });

      setAuthToken(response.accessToken);
      router.replace(getLandingPath(response.user.roles));
    } catch {
      setError('Invalid email or password.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="page-stack">
      <div className="split-grid split-grid--balanced">
        <Panel
          title="Sign in"
          description="Use one of the seeded MVP users to verify role-based landing pages and shell visibility."
          muted
        >
          <form onSubmit={(event) => void handleSubmit(event)} className="page-stack">
            <FormGrid>
              <Field label="Email">
                <input
                  className="control"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  autoComplete="email"
                  aria-label="Email"
                />
              </Field>

              <Field label="Password">
                <input
                  className="control"
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  autoComplete="current-password"
                  aria-label="Password"
                />
              </Field>
            </FormGrid>

            {error ? (
              <Notice title="Unable to sign in" tone="warning">
                <span role="alert">{error}</span>
              </Notice>
            ) : null}

            <div className="page-shell__actions">
              <Button type="submit" tone="primary" disabled={isSubmitting}>
                {isSubmitting ? 'Signing in...' : 'Sign in'}
              </Button>
            </div>
          </form>
        </Panel>

        <Panel
          title="MVP-010 review users"
          description="The shell slice expects one user per fixed role. Manual checkpoint instructions will point to the same accounts."
        >
          <div className="stack">
            <div className="link-list__item">
              <span>admin.review@impeasy.local</span>
              <span className="muted-copy">admin</span>
            </div>
            <div className="link-list__item">
              <span>office@impeasy.local</span>
              <span className="muted-copy">office</span>
            </div>
            <div className="link-list__item">
              <span>planner@impeasy.local</span>
              <span className="muted-copy">planner</span>
            </div>
            <div className="link-list__item">
              <span>operator@impeasy.local</span>
              <span className="muted-copy">operator</span>
            </div>
          </div>
        </Panel>
      </div>
    </div>
  );
}
