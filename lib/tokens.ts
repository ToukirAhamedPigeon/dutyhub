import { getSession } from 'next-auth/react';

export const accessToken= async() => {
    const session = await getSession();
    if (!session?.accessToken) {
      console.error('No access token found in session');
    }
    return session!.accessToken;
}

export const authorizationHeader = async () => {
  const session = await getSession();
  const token = session?.accessToken;
  if (!token) {
    console.warn('No access token found in session');
  }

  return {
    Authorization: `Bearer ${token}`,
  };
};

export const getAuthenticatedUserId = async () => {
  const session = await getSession();
  if (!session?.user?.id) {
    console.warn('No user ID found in session');
    return null;
  }
  return session.user.id;
};