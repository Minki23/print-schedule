import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import PrinterModel from '@/models/Printer';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/authOptions';

export async function GET(request: Request) {
  try {
    await dbConnect();
    const printers = await PrinterModel.find();
    return NextResponse.json({ printers });
  } catch (error) {
    console.error('Error fetching printers:', error);
    return NextResponse.json({ error: 'Failed to fetch printers' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.rank !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    const { name } = await request.json();
    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    const newPrinter = await PrinterModel.create({ name, occupied: false });
    console.log('Newly created printer:', newPrinter);
    return NextResponse.json({ printer: newPrinter }, { status: 201 });
  } catch (error) {
    console.error('Error creating printer:', error);
    return NextResponse.json({ error: 'Failed to create printer' }, { status: 500 });
  }
}


