import mongoose from "mongoose";

type MongooseCache = {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
};

declare global {
  // eslint-disable-next-line no-var
  var mongooseCache: MongooseCache | undefined;
}

const cached: MongooseCache = global.mongooseCache ?? {
  conn: null,
  promise: null,
};

global.mongooseCache = cached;

export async function connectDB() {
  if (cached.conn) return cached.conn;

  const MONGODB_URI = process.env.MONGODB_URI;
  if (!MONGODB_URI) {
    throw new Error(
      "Configura o ficheiro .env.local com a tua MONGODB_URI do Atlas."
    );
  }
  if (MONGODB_URI.includes("SEU_CLUSTER") || MONGODB_URI.includes("SEU_USER")) {
    throw new Error(
      "O .env.local ainda tem valores de exemplo (SEU_CLUSTER). Copia a URI real do MongoDB Atlas."
    );
  }

  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGODB_URI);
  }

  cached.conn = await cached.promise;
  return cached.conn;
}

