import bcrypt from 'bcryptjs';

// 12 rounds is the current sensible default — meaningfully slower to brute-force than 10
// while staying fast enough for interactive login. Only affects newly created hashes.
const SALT_ROUNDS = 12;

export const hashPassword = async (password: string): Promise<string> => {
  return bcrypt.hash(password, SALT_ROUNDS);
};

export const comparePassword = async (
  password: string,
  hashedPassword: string
): Promise<boolean> => {
  return bcrypt.compare(password, hashedPassword);
};
