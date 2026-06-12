export interface Role {
  id: number;
  name: string;
}

export interface Permission {
  id: number;
  name: string;
}

export interface UserModel {
  id: number;
  username: string;
  name: string;
  lastname: string;
  mail: string;
  phone: string | null;
  active: boolean;
  temporary: boolean;
  roles: Role[];
  permissions: Permission[];
  roleIds: number[];
  permissionIds: number[];
}

export interface CreateUserRequest {
  username: string;
  name: string;
  lastname: string;
  mail: string;
  phone?: string;
  password?: string;
  active: boolean;
  roleIds: number[];
}

export interface StatusRequest {
  active: boolean;
}
