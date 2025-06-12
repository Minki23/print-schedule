import { JWT as NextAuthJWT } from 'next-auth/jwt';
import CredentialsProvider from 'next-auth/providers/credentials';
import dbConnect from '@/lib/dbConnect';
import UserModel from '@/models/User';
import bcrypt from 'bcryptjs';
import { AuthOptions, User as NextAuthUser, Session as NextAuthSession } from 'next-auth';

interface MyAppUser {
  id: string;
  name?: string | null;
  email?: string | null;
  rank: 'user' | 'admin';
  status: 'pending' | 'approved' | 'rejected';
}
// eslint-disable-next-line @typescript-eslint/no-empty-interface
declare module 'next-auth' {
  interface Session {
    user: MyAppUser;
  }
  // eslint-disable-next-line @typescript-eslint/no-empty-interface
  interface User extends MyAppUser {}
}

declare module 'next-auth/jwt' {
  interface JWT extends MyAppUser {}
}

export const authOptions: AuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials): Promise<MyAppUser | null> {
        try {
          if (!credentials?.email || !credentials.password) {
                console.log("Missing credentials:", credentials);
                return null;
          }
          
          await dbConnect();

          const userFromDb = await UserModel.findOne({ email: credentials.email }).select('+password'); // Added .select('+password')

          if (!userFromDb) {
                console.log("User not found:", credentials.email);
                return null;
          }

          if (!userFromDb.password) {
                console.log("No password for user (this shouldn't happen if .select(\'+password\') worked):", credentials.email);
                return null;
          }

          const isPasswordMatch = await bcrypt.compare(credentials.password, userFromDb.password);

          if (!isPasswordMatch) {
                console.log("Invalid password for:", credentials.email);
                return null;
          }

          if (userFromDb.status !== 'approved') {
            console.log("User not approved:", userFromDb.status);
            return null;
          }

          return {
            id: userFromDb._id.toString(),
            email: userFromDb.email,
            name: userFromDb.name,
            rank: userFromDb.rank,
            status: userFromDb.status,
          };
        } catch (error) {
          console.error("Error in NextAuth authorize function:", error);
          return null;
        }
      }
    })
  ],
  session: {
    strategy: 'jwt',
  },
  callbacks: {
    async jwt({ token, user }: { token: NextAuthJWT; user?: NextAuthUser }) {
      if (user) {
        const appUser = user as MyAppUser;
        token.id = appUser.id;
        token.name = appUser.name;
        token.email = appUser.email;
        token.rank = appUser.rank;
        token.status = appUser.status;
      }
      return token;
    },
    async session({ session, token }: { session: NextAuthSession; token: NextAuthJWT }) {
      session.user = {
        id: token.id as string,
        name: token.name as string | null | undefined,
        email: token.email as string | null | undefined,
        rank: token.rank as 'user' | 'admin',
        status: token.status as 'pending' | 'approved' | 'rejected',
      };
      return session;
    }
  },
  pages: {
    signIn: '/', // Corrected: This should be the URL path to your sign-in page
  },
  secret: process.env.NEXTAUTH_SECRET,
};
