// ============================================================
// jwt.strategy.ts — JWT Passport Strategy
// ============================================================
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { AuthService } from '../../modules/auth/auth.service';

// 启动时检查 AUTH_SECRET 长度≥32
const JWT_SECRET = process.env.JWT_SECRET || process.env.AUTH_SECRET || '';
if (JWT_SECRET.length < 32) {
  throw new Error(
    'FATAL: JWT_SECRET/AUTH_SECRET must be at least 32 characters long. ' +
    'Please set a secure secret in your environment variables.'
  );
}

interface JwtPayload {
  sub: string;
  type: string;
  jti?: string;
  iat: number;
  exp: number;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private authService: AuthService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: JWT_SECRET,
    });
  }

  async validate(payload: JwtPayload) {
    // 检查 token 是否在黑名单中 (logout 后的 token)
    if (payload.jti) {
      const isBlacklisted = await this.authService.isTokenBlacklisted(payload.jti);
      if (isBlacklisted) {
        throw new UnauthorizedException('Token has been revoked');
      }
    }
    
    const user = await this.authService.validateUser(payload.sub);
    if (!user) throw new UnauthorizedException();
    return user;
  }
}
