/**
 * This file configures authentication using NextAuth with a credentials-based provider.
 * It connects to a MongoDB database, verifies user credentials (username/password),
 * and uses JWT-based sessions. It also attaches the authenticated user ID to the session and token
 * for further authorization use throughout the app.
 */

import NextAuth from 'next-auth'; // Import NextAuth core
import CredentialsProvider from 'next-auth/providers/credentials'; // Import the credentials provider
import { dbConnect } from '@/lib/database/mongoose'; // Import database connection helper
import User from '@/lib/database/models/user.model'; // Import User model from database
import bcrypt from 'bcryptjs'; // Import bcrypt to compare hashed passwords

// Define the NextAuth configuration object
export const authOptions = NextAuth({
  session: { strategy: 'jwt' }, // Use JWT strategy for managing sessions (stateless)

  providers: [
    // Configure the credentials provider for username/password login
    CredentialsProvider({
      // Define expected fields from the login form
      credentials: {
        username: { label: 'Username', type: 'text' },
        password: { label: 'Password', type: 'password' }
      },
      
      // Function called when a user attempts to sign in
      async authorize(credentials) {
        await dbConnect(); // Connect to MongoDB

        // Look up the user by username
        const user = await User.findOne({ username: credentials?.username });

        // If user doesn't exist, throw an error
        if (!user) throw new Error('No user found');

        // Compare provided password with stored hashed password
        const isValid = await bcrypt.compare(credentials!.password, user.password);

        // If password is invalid, throw an error
        if (!isValid) throw new Error('Invalid credentials');

        // If valid, return a user object to include in the JWT
        return { id: user._id.toString(), name: user.name, username: user.username };
      }
    })
  ],

  callbacks: {
    // Modify the JWT token after authentication
    async jwt({ token, user }) {
      if (user) token.id = user.id; // Add user ID to token payload
      return token; // Return updated token
    },

    // Modify the session object returned to the client
    async session({ session, token }) {
      // If session has a user and token includes ID, attach ID to session.user
      if (session.user && token.id) {
        session.user.id = token.id as string;
      }
      return session; // Return updated session
    }
  }
});

// Create the NextAuth handler using the configuration
const handler = NextAuth(authOptions);

// Export the handler for GET and POST HTTP methods
export { handler as GET, handler as POST };
