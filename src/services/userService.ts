    // src/services/userService.ts
    import { AppDataSource } from "../config/data-source";
    import { User } from "../models/User";
    import { CreateUserInput, UpdateUserInput } from "../types/UserTypes";
    import { ApiError } from "../utils/ApiError";

    export const createUser = async (input: CreateUserInput): Promise<User> => {
    const userRepository = AppDataSource.getRepository(User);

    const existingUser = await userRepository.findOne({ where: { email: input.email } });
    if (existingUser) {
        throw new ApiError(400, "User with this email already exists");
    }

    const user = userRepository.create(input);
    await userRepository.save(user);
    return user;
    };

    export const getAllUsers = async (): Promise<User[]> => {
    const userRepository = AppDataSource.getRepository(User);
    return await userRepository.find();
    };

    export const getUserById = async (id: string): Promise<User> => {
    const userRepository = AppDataSource.getRepository(User);
    const user = await userRepository.findOne({ where: { id } });
    if (!user) {
        throw new ApiError(404, "User not found");
    }
    return user;
    };

    export const updateUser = async (id: string, input: UpdateUserInput): Promise<User> => {
    const userRepository = AppDataSource.getRepository(User);
    let user = await userRepository.findOne({ where: { id } });
    if (!user) {
        throw new ApiError(404, "User not found");
    }
    user = userRepository.merge(user, input);
    await userRepository.save(user);
    return user;
    };

    export const deleteUser = async (id: string): Promise<void> => {
    const userRepository = AppDataSource.getRepository(User);
    const result = await userRepository.delete(id);
    if (result.affected === 0) {
        throw new ApiError(404, "User not found");
    }
    };
