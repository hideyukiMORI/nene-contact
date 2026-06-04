import type { CreateUserDto, UpdateUserDto, UserDto, UserListDto } from '@/entities/user/api-types';
import type { CreateUserInput, UpdateUserInput, User } from '@/entities/user/model';

export function toUser(dto: UserDto): User {
  return {
    id: dto.id,
    email: dto.email,
    role: dto.role,
    status: dto.status,
  };
}

export function toUsers(dto: UserListDto): User[] {
  return (dto.items ?? []).map(toUser);
}

export function toCreateUserDto(input: CreateUserInput): CreateUserDto {
  return { email: input.email, password: input.password, role: input.role };
}

export function toUpdateUserDto(input: UpdateUserInput): UpdateUserDto {
  return {
    ...(input.role !== undefined ? { role: input.role } : {}),
    ...(input.status !== undefined ? { status: input.status } : {}),
  };
}
