import { MongoClient } from 'mongodb';
import { hash } from 'bcrypt';

async function initializeDatabase() {
  if (!process.env.MONGODB_URI) {
    throw new Error('Invalid/Missing environment variable: "MONGODB_URI"');
  }

  try {
    const uri = process.env.MONGODB_URI;
    const client = new MongoClient(uri);
    await client.connect();
    console.log('Connected to MongoDB');

    const db = client.db();
    
    // Check if users collection exists, create it if not
    const collections = await db.listCollections({ name: 'users' }).toArray();
    if (collections.length === 0) {
      console.log('Creating users collection');
      await db.createCollection('users');
      
      // Create indexes for email (unique)
      await db.collection('users').createIndex({ email: 1 }, { unique: true });
      
      // Add a demo user for testing
      const demoUser = {
        name: 'Demo User',
        email: 'user@example.com',
        password: await hash('password', 10),
        preferences: { role: 'user' },
        createdAt: new Date()
      };
      
      await db.collection('users').insertOne(demoUser);
      console.log('Demo user created');
    } else {
      console.log('Users collection already exists');
    }
    
    // Check if NextAuth collections exist, create them if not
    const requiredCollections = [
      'accounts',
      'sessions',
      'verification_tokens'
    ];
    
    for (const collectionName of requiredCollections) {
      const collExists = await db.listCollections({ name: collectionName }).toArray();
      if (collExists.length === 0) {
        console.log(`Creating ${collectionName} collection`);
        await db.createCollection(collectionName);
      } else {
        console.log(`${collectionName} collection already exists`);
      }
    }
    
    console.log('Database initialization complete');
    await client.close();
  } catch (error) {
    console.error('Failed to initialize database:', error);
    process.exit(1);
  }
}

initializeDatabase(); 