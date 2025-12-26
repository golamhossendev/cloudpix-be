import { getContainer } from '@src/services/azure/CosmosService';
import { CONTAINER_NAMES } from './database';
import { IUser } from '@src/models/User';
import logger from 'jet-logger';

/******************************************************************************
                                 Functions
******************************************************************************/

/**
 * Create a new user
 */
export const createUser = async (user: IUser): Promise<IUser> => {
  try {
    const container = await getContainer(CONTAINER_NAMES.USERS, '/userId');
    const { resource } = await container.items.create(user);
    
    if (!resource) {
      throw new Error('Failed to create user');
    }
    
    return resource as IUser;
  } catch (error: any) {
    if (error.code === 409) {
      throw new Error('User with this email already exists');
    }
    logger.err(error);
    throw new Error('Failed to create user');
  }
};

/**
 * Get user by userId
 */
export const getUserById = async (userId: string): Promise<IUser | null> => {
  try {
    const container = await getContainer(CONTAINER_NAMES.USERS, '/userId');
    const { resource } = await container.item(userId, userId).read<IUser>();
    return resource || null;
  } catch (error: any) {
    if (error.code === 404) {
      return null;
    }
    logger.err(error);
    throw new Error('Failed to get user');
  }
};

/**
 * Get user by email
 */
export const getUserByEmail = async (email: string): Promise<IUser | null> => {
  try {
    const container = await getContainer(CONTAINER_NAMES.USERS, '/userId');
    const querySpec = {
      query: 'SELECT * FROM c WHERE c.email = @email',
      parameters: [
        {
          name: '@email',
          value: email,
        },
      ],
    };

    const { resources } = await container.items.query<IUser>(querySpec).fetchAll();
    return resources.length > 0 ? resources[0] : null;
  } catch (error) {
    logger.err(error);
    throw new Error('Failed to get user by email');
  }
};

/**
 * Update user
 */
export const updateUser = async (user: IUser): Promise<IUser> => {
  try {
    const container = await getContainer(CONTAINER_NAMES.USERS, '/userId');
    const { resource } = await container.item(user.userId, user.userId).replace(user);
    
    if (!resource) {
      throw new Error('Failed to update user');
    }
    
    return resource as IUser;
  } catch (error) {
    logger.err(error);
    throw new Error('Failed to update user');
  }
};

/**
 * Update last login timestamp
 */
export const updateLastLogin = async (userId: string): Promise<void> => {
  try {
    const user = await getUserById(userId);
    if (!user) {
      throw new Error('User not found');
    }
    
    user.lastLogin = new Date();
    await updateUser(user);
  } catch (error) {
    logger.err(error);
    throw new Error('Failed to update last login');
  }
};

/******************************************************************************
                            Export default
******************************************************************************/

export default {
  createUser,
  getUserById,
  getUserByEmail,
  updateUser,
  updateLastLogin,
};

