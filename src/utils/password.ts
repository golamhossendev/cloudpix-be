import bcrypt from 'bcrypt';
import logger from 'jet-logger';

/******************************************************************************
                                 Constants
******************************************************************************/

const SALT_ROUNDS = 10;

/******************************************************************************
                                 Functions
******************************************************************************/

/**
 * Hash a password
 */
export const hashPassword = async (password: string): Promise<string> => {
  try {
    return await bcrypt.hash(password, SALT_ROUNDS);
  } catch (error) {
    logger.err(error);
    throw new Error('Failed to hash password');
  }
};

/**
 * Compare a password with a hash
 */
export const comparePassword = async (
  password: string,
  hash: string
): Promise<boolean> => {
  try {
    return await bcrypt.compare(password, hash);
  } catch (error) {
    logger.err(error);
    throw new Error('Failed to compare password');
  }
};

/******************************************************************************
                            Export default
******************************************************************************/

export default {
  hashPassword,
  comparePassword,
};

