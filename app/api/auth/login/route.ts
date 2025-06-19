import { NextApiRequest, NextApiResponse } from 'next';
import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import User from '@/lib/database/models/user.model';

export default async function auth(req: NextApiRequest, res: NextApiResponse) {
  return await NextAuth(req, res, {
    providers: [
      CredentialsProvider({
        name: 'Credentials',
        credentials: {
          username: { label: 'Username', type: 'text' },
          password: { label: 'Password', type: 'password' },
        },
        async authorize(credentials) {
          const user = await User.findOne({ username: credentials?.username });
          if (!user) return null;

          const isValid = await bcrypt.compare(credentials!.password, user.password);
          if (!isValid) return null;

          return { id: user._id, name: user.name, email: user.email };
        },
      }),
    ],
    session: { strategy: 'jwt' },
    pages: { signIn: '/login' },
    callbacks: {
      async jwt({ token, user }) {
        if (user) token.id = user.id;
        return token;
      },
      async session({ session, token }) {
        session.user.id = token.id;
        return session;
      },
    },
  });
}