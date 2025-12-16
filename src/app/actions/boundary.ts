import { getMe } from './get-me';

export const accessCheck = async (): Promise<boolean> => {
  try {
    const user = await getMe();
    if (!user) {
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in boundary:', error);
    return false;
  }
};
