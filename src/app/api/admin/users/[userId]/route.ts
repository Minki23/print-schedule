import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/authOptions';
import dbConnect from '@/lib/dbConnect';
import UserModel from '@/models/User';

export async function PUT(request: Request, context: any) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.rank !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    const { userId } = context.params;
    const { action } = await request.json();

    const update: Partial<{ rank: string; status: string }> = {};
    switch (action) {
      case 'approve':
        update.status = 'approved';
        break;
      case 'reject':
        update.status = 'rejected';
        break;
      case 'makeAdmin':
        update.rank = 'admin';
        break;
      case 'revokeAdmin':
        update.rank = 'user';
        break;
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    const updatedUser = await UserModel.findByIdAndUpdate(userId, update, { new: true });
    if (!updatedUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    return NextResponse.json({ user: updatedUser });
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
  }
}
