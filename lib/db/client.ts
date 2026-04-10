// This approach is taken from https://github.com/vercel/next.js/tree/canary/examples/with-mongodb
import { MongoClient, ServerApiVersion } from 'mongodb'

if (!process.env.MONGODB_URI && process.env.NODE_ENV !== 'production') {
  console.warn('Missing MONGODB_URI environment variable')
}

const uri = process.env.MONGODB_URI || ''
const options = {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
}

let client: MongoClient

// Only initialize MongoClient if we have a valid URI
if (uri) {
  if (process.env.NODE_ENV === 'development') {
    // In development mode, use a global variable so that the value
    // is preserved across module reloads caused by HMR (Hot Module Replacement).
    const globalWithMongo = global as typeof globalThis & {
      _mongoClient?: MongoClient
    }

    if (!globalWithMongo._mongoClient) {
      globalWithMongo._mongoClient = new MongoClient(uri, options)
    }
    client = globalWithMongo._mongoClient
  } else {
    // In production mode, it's best to not use a global variable.
    client = new MongoClient(uri, options)
  }
} else {
  // Create a dummy client that will throw when used
  client = new Proxy(
    {} as MongoClient,
    {
      get: () => {
        throw new Error('MongoDB client not initialized - MONGODB_URI is missing')
      },
    }
  )
}

// Export a module-scoped MongoClient. By doing this in a
// separate module, the client can be shared across functions.
export default client
