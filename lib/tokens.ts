import { authOptions }  from "@/app/api/(public)/auth/[...nextauth]/route";
import { getServerSession } from "next-auth";
import { getSession } from 'next-auth/react';

export const accessTokenServer = async () => {
  const session = await getServerSession(authOptions);
  if (!session?.accessToken) {
    console.error('No access token found in session');
  }
  return session?.accessToken;
};

export const authorizationHeaderServer = async () => {
  const token = await accessTokenServer();
  if (!token) {
    console.warn('No access token found in session');
  }

  return {
    Authorization: `Bearer ${token}`,
  };
};

export const getAuthenticatedUserIdServer = async () => {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    console.warn('No user ID found in session');
    return null;
  }

  return session.user.id;
};

export const accessToken = async () => {
  const session = await getSession();
  if (!session?.accessToken) {
    console.error('No access token found in session');
  }
  return session?.accessToken;
};

export const authorizationHeader = async () => {
  const token = await accessToken();
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