import { createUploadthing, type FileRouter } from 'uploadthing/next'
import { UploadThingError } from 'uploadthing/server'
import { auth } from '@/auth'

const f = createUploadthing()

const requireAuth = async () => {
  const session = await auth()

  if (!session?.user?.id) {
    throw new UploadThingError('Unauthorized')
  }

  return { userId: session.user.id, role: session.user.role }
}

// FileRouter for your app, can contain multiple FileRoutes
export const ourFileRouter = {
  // Define as many FileRoutes as you like, each with a unique routeSlug
  imageUploader: f({ image: { maxFileSize: '4MB' } })
    .middleware(requireAuth)
    .onUploadComplete(async ({ metadata }) => ({
      uploadedBy: metadata.userId,
    })),
  productImage: f({ image: { maxFileSize: '4MB' } })
    .middleware(requireAuth)
    .onUploadComplete(async ({ metadata }) => ({
      uploadedBy: metadata.userId,
    })),
  bannerImage: f({ image: { maxFileSize: '8MB' } })
    .middleware(async () => {
      const session = await auth()

      if (!session?.user?.id) {
        throw new UploadThingError('Unauthorized')
      }

      if (session.user.role !== 'admin') {
        throw new UploadThingError('Admin access required')
      }

      return { userId: session.user.id, role: session.user.role }
    })
    .onUploadComplete(async ({ metadata }) => ({
      uploadedBy: metadata.userId,
    })),
  vendorLogo: f({ image: { maxFileSize: '4MB' } })
    .middleware(requireAuth)
    .onUploadComplete(async ({ metadata }) => ({
      uploadedBy: metadata.userId,
    })),
} satisfies FileRouter

export type OurFileRouter = typeof ourFileRouter
