import { userRepository } from "../repository/user.repository";
import { CreateUserInput, UpdateUserInput } from "../dto/user.dto";
import { ConflictError, NotFoundError } from "../../../shared/errors/app-error";

export const userService = {
  getAllUsers: async () => {
    return userRepository.findAll();
  },

  getUserById: async (id: string) => {
    const user = await userRepository.findById(id);
    if (!user) throw new NotFoundError("User");
    return user;
  },

  createUser: async (data: CreateUserInput) => {
    const existing = await userRepository.findByEmail(data.email);
    if (existing) throw new ConflictError("User with this email already exists");
    return userRepository.create(data);
  },

  updateUser: async (id: string, data: UpdateUserInput) => {
    const existing = await userRepository.findById(id);
    if (!existing) throw new NotFoundError("User");
    return userRepository.update(id, data);
  },

  deleteUser: async (id: string) => {
    const existing = await userRepository.findById(id);
    if (!existing) throw new NotFoundError("User");
    await userRepository.delete(id);
  },
};
