'use client';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { useRouter } from 'next/navigation';
import React, { FormEvent, useState } from 'react';

import { loginUser } from '../../lib/api';
import { setAuthToken } from '../../lib/auth-storage';
import { getLandingPath } from '../../lib/navigation';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function LoginPage(): JSX.Element {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validate = (): string | null => {
    if (!username.trim()) {
      return 'Username is required.';
    }

    if (EMAIL_PATTERN.test(username.trim()) && password.length < 8) {
      return 'Password must be at least 8 characters.';
    }

    if (!password) {
      return 'Password is required.';
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
        email: username.trim().toLowerCase(),
        password,
      });

      setAuthToken(response.accessToken);
      router.replace(getLandingPath(response.user.roles));
    } catch {
      setError('Invalid username or password.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '80vh',
        px: 2,
      }}
    >
      <Typography
        component="h1"
        variant="h4"
        sx={{ fontWeight: 600, mb: 4 }}
      >
        IMPEasy
      </Typography>

      <Box
        component="form"
        noValidate
        onSubmit={(e) => void handleSubmit(e)}
        sx={{
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
          width: '100%',
          maxWidth: 320,
        }}
      >
        <TextField
          label="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          autoComplete="username"
          fullWidth
          required
          error={Boolean(error)}
          placeholder="Use your email address"
        />

        <TextField
          label="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
          fullWidth
          required
          error={Boolean(error)}
          helperText={error ?? undefined}
        />

        <Button
          type="submit"
          variant="contained"
          disabled={isSubmitting}
          fullWidth
          sx={{ mt: 1 }}
        >
          {isSubmitting ? 'Signing in...' : 'Sign in'}
        </Button>
      </Box>
    </Box>
  );
}
