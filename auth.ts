import Google from 'next-auth/providers/google'
import bcrypt from 'bcryptjs'
import CredentialsProvider from 'next-auth/providers/credentials'

import NextAuth, { type DefaultSession } from 'next-auth'
import authConfig from './auth.config'

declare module 'next-auth' {
  interface Session {
    user: {
      role: string
    } & DefaultSession['user']
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  trustHost: true,
  pages: {
    signIn: '/sign-in',
    newUser: '/sign-up',
    error: '/sign-in',
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60,
  },
  // MongoDB Adapter removed - using JWT sessions instead
  // This prevents Edge Runtime compatibility issues with Mongoose
  providers: [
    Google({
      allowDangerousEmailAccountLinking: true,
    }),
    CredentialsProvider({
      credentials: {
        email: {
          type: 'email',
        },
        password: { type: 'password' },
      },
      async authorize(credentials) {
        // Dynamically import database code to avoid Edge Runtime issues
        const { connectToDatabase } = await import('./lib/db')
        await connectToDatabase()
        if (credentials == null) return null

        // Import User model only when authorize is called (server-side only)
        const User = (await import('./lib/db/models/user.model')).default

        const user = await User.findOne({ email: credentials.email })

        if (user && user.password) {
          const isMatch = await bcrypt.compare(
            credentials.password as string,
            user.password
          )
          if (isMatch) {
            return {
              id: user._id,
              name: user.name,
              email: user.email,
              role: user.role,
            }
          }
        }
        return null
      },
    }),
  ],
  callbacks: {
    jwt: async ({ token, user, trigger, session }) => {
      if (user) {
        const { connectToDatabase } = await import('./lib/db')
        const User = (await import('./lib/db/models/user.model')).default

        await connectToDatabase()

        const dbUser = await User.findById(user.id)

        if (!user.name) {
          await User.findByIdAndUpdate(user.id, {
            name: user.name || user.email!.split('@')[0],
          })
        }

        token.name = user.name || user.email!.split('@')[0]
        token.email = user.email
        token.role = (dbUser?.role || (user as { role?: string }).role || 'user') as string
      }

      if (trigger === 'update' && session?.user?.name) {
        token.name = session.user.name
      }
      if (trigger === 'update' && session?.user?.email) {
        token.email = session.user.email
      }
      return token
    },
    session: async ({ session, user, trigger, token }) => {
      session.user.id = token.sub as string
      session.user.role = (token.role as string) || 'user'
      session.user.name = token.name
      session.user.email = token.email as string
      return session
    },
  },
})
