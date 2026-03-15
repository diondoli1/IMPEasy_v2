import { Injectable, UnauthorizedException } from '@nestjs/common';
import { createHmac, timingSafeEqual } from 'node:crypto';

import type { AuthTokenPayload } from './interfaces/auth-token-payload.interface';

const DEFAULT_TOKEN_SECRET = 'impeasy-dev-auth-secret-change-me';
const DEFAULT_TOKEN_TTL_SECONDS = 60 * 60;

@Injectable()
export class AuthTokenService {
  private readonly tokenSecret = process.env.AUTH_TOKEN_SECRET ?? DEFAULT_TOKEN_SECRET;
  private readonly tokenTtlSeconds = this.resolveTokenTtlSeconds();

  sign(payload: Pick<AuthTokenPayload, 'sub' | 'email'>): string {
    const issuedAt = Math.floor(Date.now() / 1000);
    const expiresAt = issuedAt + this.tokenTtlSeconds;
    const tokenPayload: AuthTokenPayload = {
      sub: payload.sub,
      email: payload.email,
      iat: issuedAt,
      exp: expiresAt,
    };

    const encodedPayload = this.encodePayload(tokenPayload);
    const signature = this.signValue(encodedPayload);

    return `${encodedPayload}.${signature}`;
  }

  verify(token: string): AuthTokenPayload {
    const [encodedPayload, signature, ...extraParts] = token.split('.');

    if (!encodedPayload || !signature || extraParts.length > 0) {
      throw new UnauthorizedException('Invalid bearer token.');
    }

    const expectedSignature = this.signValue(encodedPayload);
    if (!this.signaturesMatch(signature, expectedSignature)) {
      throw new UnauthorizedException('Invalid bearer token.');
    }

    const payload = this.decodePayload(encodedPayload);
    if (!this.isValidPayload(payload)) {
      throw new UnauthorizedException('Invalid bearer token payload.');
    }

    if (Math.floor(Date.now() / 1000) >= payload.exp) {
      throw new UnauthorizedException('Bearer token expired.');
    }

    return payload;
  }

  private resolveTokenTtlSeconds(): number {
    const configuredValue = Number.parseInt(
      process.env.AUTH_TOKEN_TTL_SECONDS ?? `${DEFAULT_TOKEN_TTL_SECONDS}`,
      10,
    );

    if (!Number.isFinite(configuredValue) || configuredValue <= 0) {
      return DEFAULT_TOKEN_TTL_SECONDS;
    }

    return configuredValue;
  }

  private signValue(value: string): string {
    return createHmac('sha256', this.tokenSecret).update(value).digest('base64url');
  }

  private signaturesMatch(provided: string, expected: string): boolean {
    const providedBuffer = Buffer.from(provided);
    const expectedBuffer = Buffer.from(expected);

    if (providedBuffer.length !== expectedBuffer.length) {
      return false;
    }

    return timingSafeEqual(providedBuffer, expectedBuffer);
  }

  private encodePayload(payload: AuthTokenPayload): string {
    return Buffer.from(JSON.stringify(payload)).toString('base64url');
  }

  private decodePayload(encodedPayload: string): unknown {
    try {
      return JSON.parse(Buffer.from(encodedPayload, 'base64url').toString('utf-8')) as unknown;
    } catch {
      throw new UnauthorizedException('Invalid bearer token payload.');
    }
  }

  private isValidPayload(payload: unknown): payload is AuthTokenPayload {
    if (!payload || typeof payload !== 'object') {
      return false;
    }

    const candidate = payload as Partial<AuthTokenPayload>;

    return (
      typeof candidate.sub === 'number' &&
      Number.isInteger(candidate.sub) &&
      candidate.sub > 0 &&
      typeof candidate.email === 'string' &&
      candidate.email.length > 0 &&
      typeof candidate.iat === 'number' &&
      Number.isInteger(candidate.iat) &&
      typeof candidate.exp === 'number' &&
      Number.isInteger(candidate.exp)
    );
  }
}
