import { User, IUser } from '../model';
import { FilterQuery, UpdateQuery, SortOrder } from 'mongoose';

export class UserRepository {
  async create(userData: Partial<IUser>): Promise<IUser> {
    const user = new User(userData);
    return user.save();
  }

  async findById(id: string): Promise<IUser | null> {
    return User.findById(id);
  }

  async findByEmail(email: string): Promise<IUser | null> {
    return User.findOne({ email: email.toLowerCase() });
  }

  async findByPhone(phone: string): Promise<IUser | null> {
    return User.findOne({ phone });
  }

  async findByEmailOrPhone(identifier: string): Promise<IUser | null> {
    return User.findOne({
      $or: [
        { email: identifier.toLowerCase() },
        { phone: identifier }
      ]
    });
  }

  async findOne(filter: FilterQuery<IUser>): Promise<IUser | null> {
    return User.findOne(filter);
  }

  async findAll(
    filter: FilterQuery<IUser> = {},
    options: {
      page?: number;
      limit?: number;
      sortBy?: string;
      sortOrder?: 'asc' | 'desc';
    } = {}
  ): Promise<{ users: IUser[]; total: number }> {
    const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc' } = options;
    const skip = (page - 1) * limit;
    const sort: { [key: string]: SortOrder } = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

    const [users, total] = await Promise.all([
      User.find(filter).sort(sort).skip(skip).limit(limit),
      User.countDocuments(filter),
    ]);

    return { users, total };
  }

  async update(id: string, updateData: UpdateQuery<IUser>): Promise<IUser | null> {
    return User.findByIdAndUpdate(id, updateData, { new: true });
  }

  async delete(id: string): Promise<IUser | null> {
    return User.findByIdAndDelete(id);
  }

  async exists(filter: FilterQuery<IUser>): Promise<boolean> {
    const count = await User.countDocuments(filter);
    return count > 0;
  }
}

export const userRepository = new UserRepository();
