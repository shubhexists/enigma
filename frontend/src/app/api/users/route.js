import { createUser } from '../../../lib/api-client';

export async function POST(request) {
  try {
    const userData = await request.json();
    const user = await createUser(userData);
    return Response.json(user);
  } catch (error) {
    console.error('Error creating user:', error);
    return Response.json({ error: 'Failed to create user' }, { status: 500 });
  }
}