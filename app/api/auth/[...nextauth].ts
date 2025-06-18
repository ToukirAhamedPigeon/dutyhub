import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { dbConnect } from '@/lib/database/mongoose';
import User from '@/lib/database/models/user.model';
import bcrypt from 'bcryptjs';

export const authOptions = NextAuth({
  session: { strategy: 'jwt' },
  providers: [
    CredentialsProvider({
        // ✅ This tells NextAuth what form fields to expect
        credentials: {
          username: { label: 'Username', type: 'text' },
          password: { label: 'Password', type: 'password' }
        },
        async authorize(credentials) {
          await dbConnect();
      
          const user = await User.findOne({ username: credentials?.username });
          if (!user) throw new Error('No user found');
      
          const isValid = await bcrypt.compare(credentials!.password, user.password);
          if (!isValid) throw new Error('Invalid credentials');
      
          return { id: user._id.toString(), name: user.name, username: user.username };
        }
      })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) token.id = user.id;
      return token;
    },
    async session({ session, token }) {
        if (session.user && token.id) {
          session.user.id = token.id as string;
        }
        return session;
      }
  }
});
const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };