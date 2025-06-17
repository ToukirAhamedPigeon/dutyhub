import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { dbConnect } from '@/lib/database/mongoose';
import User from '@/lib/database/models/user.model';
import bcrypt from 'bcryptjs';

// const handler = NextAuth({
//   session: { strategy: 'jwt' },
//   providers: [
//     CredentialsProvider({
//       async authorize(credentials) {
//         await dbConnect();
//         const user = await User.findOne({ username: credentials.username });
//         if (!user) throw new Error('No user found');
//         const isValid = await bcrypt.compare(credentials.password, user.password);
//         if (!isValid) throw new Error('Invalid credentials');
//         return { id: user._id, name: user.name, username: user.username };
//       }
//     })
//   ],
//   callbacks: {
//     async jwt({ token, user }) {
//       if (user) token.id = user.id;
//       return token;
//     },
//     async session({ session, token }) {
//       session.user.id = token.id;
//       return session;
//     }
//   }
// });

// export { handler as GET, handler as POST };