import { getUserByExternalId } from '../../../../../lib/api-client';

export async function GET(request, { params }) {
  try {
    const { externalId } = await params;
    const user = await getUserByExternalId(externalId);

    if (!user) {
      return Response.json({ error: 'User not found' }, { status: 404 });
    }

    return Response.json(user);
  } catch (error) {
    console.error('Error getting user:', error);
    return Response.json({ error: 'Failed to get user' }, { status: 500 });
  }
}

