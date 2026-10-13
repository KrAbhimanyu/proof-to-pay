import { db } from './index.ts';
import { users, projects, studentProfiles, businessProfiles, applications } from './schema.ts';
import { eq, desc } from 'drizzle-orm';

export async function getOrCreateUser(uid: string, email: string, name?: string, role?: string) {
  try {
    const result = await db
      .insert(users)
      .values({
        uid,
        email,
        name: name || '',
        role: role || 'STUDENT',
      })
      .onConflictDoUpdate({
        target: users.uid,
        set: {
          email,
          ...(name ? { name } : {}),
        },
      })
      .returning();

    return result[0];
  } catch (error) {
    console.error('getOrCreateUser database error:', error);
    throw new Error('Database operation failed for user.', { cause: error });
  }
}

export async function getUsers() {
  try {
    return await db.select().from(users);
  } catch (error) {
    console.error('Database query failed for users:', error);
    throw new Error('Database query failed. Please try again later.', { cause: error });
  }
}

export async function getProjectsList() {
  try {
    return await db.select().from(projects).orderBy(desc(projects.createdAt));
  } catch (error) {
    console.error('Database query failed for projects:', error);
    throw new Error('Database query failed for projects.', { cause: error });
  }
}
