import { Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import { PrismaService } from "src/prisma.service";

export interface jwtPayload {
 sub: string;
 email: string;
 role: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
 constructor(
  private readonly configService: ConfigService,
  private readonly prisma: PrismaService
 ) {
  super({
   jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
   ignoreExpiration: false,
   secretOrKey: configService.get<string>('JWT_SECRET')!,
  })
 }
 async validate(payload: jwtPayload) {
  const user = await this.prisma.user.findUnique({
   where: {
    id: payload.sub
   },
   select: {
    id: true,
    email: true,
    firstName: true,
    lastName: true,
    role: true,
    isActive: true
   }
  });

  if (!user || !user.isActive) {
   throw new UnauthorizedException('user not found or inactive');
  }
  return user;
 }
}