import type { components } from '@/shared/api/schema.gen';

export type UserDto = components['schemas']['UserResponse'];
export type UserListDto = components['schemas']['UserListResponse'];
export type CreateUserDto = components['schemas']['CreateUserRequest'];
export type UpdateUserDto = components['schemas']['UpdateUserRequest'];
