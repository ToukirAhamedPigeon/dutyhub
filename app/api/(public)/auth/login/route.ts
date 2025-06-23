import { NextApiRequest, NextApiResponse } from 'next';
import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import User from '@/lib/database/models/user.model';
import { signRefreshToken, signAccessToken } from '@/lib/jwt'; 

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

          console.log(user);

          const isValid = await bcrypt.compare(credentials!.password, user.password);
          if (!isValid) return null;

          console.log(isValid);

          const refreshToken = signRefreshToken({ id: user._id });
          user.refreshToken = refreshToken;
          await user.save();

          console.log(refreshToken);


          const accessToken = signAccessToken({
            id: user._id,
            name: user.name,
            username: user.username,
            email: user.email,
          });

          console.log(accessToken);
          console.log(user);
          console.log(refreshToken);

          return {
            id: user._id.toString(),
            name: user.name,
            email: user.email,
            accessToken,
            refreshToken,
          };
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
        session.user.id = token.id ?? '';
        return session;
      },
    },
  });
}