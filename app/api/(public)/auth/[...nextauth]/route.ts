import NextAuth, { NextAuthOptions, Session } from 'next-auth';
import type { Account, User as NextAuthUser, Profile } from 'next-auth';
import type { JWT } from 'next-auth/jwt';
import CredentialsProvider from 'next-auth/providers/credentials';
import { dbConnect } from '@/lib/database/mongoose';
import User from '@/lib/database/models/user.model';
import bcrypt from 'bcryptjs';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '@/lib/jwt';

interface AuthUser {
  id: string;
  username: string;
  accessToken: string;
  refreshToken: string;
}

export const authOptions: NextAuthOptions = {
  session: { strategy: 'jwt' },

  providers: [
    CredentialsProvider({
      credentials: {
        username: { label: 'Username', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials): Promise<AuthUser | null> {
        await dbConnect();

        const user = await User.findOne({ username: credentials?.username });
        if (!user) return null;  // changed from throw to null

        const isValid = await bcrypt.compare(credentials!.password, user.password);
        if (!isValid) return null;  // changed from throw to null

        // Generate refresh token and save to DB
        const refreshToken = signRefreshToken({ id: user._id.toString() });
        user.refreshToken = refreshToken;
        await user.save();

        // Generate access token
        const accessToken = signAccessToken({
          id: user._id.toString(),
          name: user.name,
          username: user.username,
          role: user.role,
          email: user.email,
        });

        return {
          id: user._id.toString(),
          username: user.username,
          refreshToken,
          accessToken,
        };
      },
    }),
  ],

  callbacks: {
    async jwt({
      token,
      user,
      account,
    }: {
      token: JWT;
      user?: NextAuthUser;
      account?: Account | null;
      profile?: Profile;
      trigger?: "signIn" | "signUp" | "update";
      isNewUser?: boolean;
      session?: any;
    }): Promise<JWT> {
      if (user && account) {
        // First-time login
        const authUser = user as AuthUser;

        token.id = authUser.id;
        token.username = authUser.username;  // Added this line
        token.accessToken = authUser.accessToken;
        token.refreshToken = authUser.refreshToken;
        token.accessTokenExpires = Date.now() + 15 * 60 * 1000;

        return token;
      }

      if (Date.now() < (token.accessTokenExpires ?? 0)) {
        return token;
      }

      // Access token expired — try to refresh it
      if (!token.refreshToken) {
        console.warn('Missing refresh token');
        return { ...token, error: 'MissingRefreshToken' };
      }
      try {
        await dbConnect();

        const decoded = verifyRefreshToken(token.refreshToken);

        if (!decoded || typeof decoded !== 'object' || typeof (decoded as any).id !== 'string') {
          throw new Error('Invalid token payload');
        }

        const userDoc = await User.findById((decoded as { id: string }).id);

        if (!userDoc) throw new Error('User not found');

        const newAccessToken = signAccessToken({
          id: userDoc._id.toString(),
          name: userDoc.name,
          username: userDoc.username,
          role: userDoc.role,
          email: userDoc.email,
        });

        // Rotate refresh token for extra security
        const newRefreshToken = signRefreshToken({ id: userDoc._id.toString() });
        userDoc.refreshToken = newRefreshToken;
        await userDoc.save();

        return {
          ...token,
          accessToken: newAccessToken,
          accessTokenExpires: Date.now() + 15 * 60 * 1000,
          refreshToken: newRefreshToken ?? token.refreshToken,
          username: userDoc.username,  // Added this line
        };
      } catch (error) {
        console.error('Error refreshing access token:', error);
        return { ...token, error: 'RefreshAccessTokenError' };
      }
    },
    async session({ session, token }: { session: Session; token: JWT }): Promise<Session> {
      if (session.user && token.id) {
        session.user.id = token.id as string;
        session.user.username = token.username as string;  // Use token.username here
        session.accessToken = token.accessToken as string;

        if (token.error) {
          (session as any).error = token.error;
        }
      }
      return session;
    },
  },

  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
