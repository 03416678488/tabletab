import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';

import { Customer } from './entities/customer.entity';
import {
  CustomerLoginDto,
  CustomerRegisterDto,
  CustomerUpdateProfileDto,
} from './dto';

const SALT_ROUNDS = 10;
/** Storefront sessions are long-lived — customers rarely re-auth. */
const TOKEN_TTL = '30d';

export interface CustomerAuthResult {
  customer: Omit<Customer, 'password'>;
  token: string;
}

/** Self-service auth for storefront customer accounts (separate from staff users). */
@Injectable()
export class CustomerAuthService {
  constructor(
    @InjectRepository(Customer)
    private readonly repo: Repository<Customer>,
    private readonly _jwt: JwtService,
  ) {}

  async register(dto: CustomerRegisterDto): Promise<CustomerAuthResult> {
    const email = dto.email.trim().toLowerCase();
    const existing = await this.repo.findOne({ where: { email } });
    if (existing) throw new ConflictException('An account with this email already exists');

    const passwordHash = await bcrypt.hash(dto.password, SALT_ROUNDS);
    const customer = await this.repo.save(
      this.repo.create({
        name: dto.name.trim(),
        email,
        phone: dto.phone?.trim() || null,
        password: passwordHash,
        isActive: true,
      }),
    );
    return this.result(customer);
  }

  async login(dto: CustomerLoginDto): Promise<CustomerAuthResult> {
    const email = dto.email.trim().toLowerCase();
    const customer = await this.repo
      .createQueryBuilder('c')
      .addSelect('c.password')
      .where('LOWER(c.email) = :email', { email })
      .getOne();

    if (!customer || !customer.password) {
      throw new UnauthorizedException('Invalid email or password');
    }
    const ok = await bcrypt.compare(dto.password, customer.password);
    if (!ok) throw new UnauthorizedException('Invalid email or password');

    return this.result(customer);
  }

  async getProfile(customerId: string): Promise<Omit<Customer, 'password'>> {
    const customer = await this.repo.findOne({ where: { id: customerId } });
    if (!customer) throw new NotFoundException('Account not found');
    return this.sanitize(customer);
  }

  async updateProfile(
    customerId: string,
    dto: CustomerUpdateProfileDto,
  ): Promise<Omit<Customer, 'password'>> {
    await this.getProfile(customerId);
    await this.repo.update(customerId, {
      ...(dto.name !== undefined ? { name: dto.name.trim() } : {}),
      ...(dto.phone !== undefined ? { phone: dto.phone.trim() || null } : {}),
      ...(dto.address !== undefined ? { address: dto.address.trim() || null } : {}),
    });
    return this.getProfile(customerId);
  }

  /** Verify a storefront bearer token and return the customer id, or 401. */
  verifyCustomerId(authorization?: string): string {
    const token = authorization?.replace(/^Bearer\s+/i, '').trim();
    if (!token) throw new UnauthorizedException('Not signed in');
    try {
      const payload = this._jwt.verify<{ sub: string; type?: string }>(token);
      if (payload.type !== 'customer' || !payload.sub) {
        throw new UnauthorizedException('Invalid session');
      }
      return payload.sub;
    } catch {
      throw new UnauthorizedException('Session expired — please sign in again');
    }
  }

  private result(customer: Customer): CustomerAuthResult {
    const token = this._jwt.sign(
      { sub: customer.id, email: customer.email, name: customer.name, type: 'customer' },
      { expiresIn: TOKEN_TTL },
    );
    return { customer: this.sanitize(customer), token };
  }

  private sanitize(customer: Customer): Omit<Customer, 'password'> {
    const { password: _password, ...rest } = customer;
    return rest;
  }
}
