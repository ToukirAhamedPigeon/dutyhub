import { getSession } from 'next-auth/react';
export const accessToken= async() => {
    const session = await getSession();
    if (!session?.accessToken) {
      console.error('No access token found in session');
      throw new Error('Unauthorized');
    }
    return session.accessToken;
}

export const authorizationHeader = async() => {
    const token = await accessToken();
    return { Authorization: `Bearer ${token}` };
}