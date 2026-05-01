import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
  ) {}
// canActivate is a method that is called before the request is handled by the controller 
  async canActivate(context: ExecutionContext): Promise<boolean> {
    // extract request from context 
    const request = context.switchToHttp().getRequest<Request>();
    // extract token from request
    const token = this.extractTokenFromHeader(request);
    // if token is not present throw error
    if (!token) throw new UnauthorizedException('No token provided');
    try {
        // verify token
      const payload = await this.jwtService.verifyAsync(token, {
        secret: this.configService.get<string>('JWT_SECRET'),
      });
      // attach user to request
      request['user'] = payload;
      return true;
    } catch (error) {
      throw new UnauthorizedException('Invalid token');
    }
  }
// extract token from header 
  private extractTokenFromHeader(request: Request): string | null {
    // split the authorization header by space and get the token if the type is Bearer
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    // return the token if the type is Bearer 
    return type === 'Bearer' ? token : null;
  }
}
