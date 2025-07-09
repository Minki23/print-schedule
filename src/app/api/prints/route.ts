import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/authOptions';
import dbConnect from '@/lib/dbConnect';
import PrintModel from '@/models/Print';
import '@/models/Printer';
import '@/models/User';
import '@/models/Filament';

export async function GET(request: Request) {
  try {
    await dbConnect();
    const prints = await PrintModel.find()
      .populate('printer')
      .populate('filament')
      .populate('scheduledBy', 'name');
    const enrichedPrints = prints.map(p => {
      let timeRemaining = null;
      if (p.status === 'printing' && p.startedAt) {
        const elapsedMilliseconds = Date.now() - new Date(p.startedAt).getTime();
        const elapsedMinutes = Math.floor(elapsedMilliseconds / 60000);
        timeRemaining = Math.max(p.duration - elapsedMinutes, 0);
      } 
      const scheduledByName = p.scheduledBy ? (p.scheduledBy as any).name : 'Unknown User';
      return {
        ...p.toObject(),
        timeRemaining,
        scheduledBy: { name: scheduledByName },
        printer: p.printer ? p.printer : { name: 'Unknown Printer', location: '', occupied: false }
      };
    });
    return NextResponse.json({ prints: enrichedPrints });
  } catch (error) {
    console.error('Error fetching prints:', error);
    return NextResponse.json({ error: 'Failed to fetch prints' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await dbConnect();
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.status !== 'approved') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { name, googleDriveLink, duration, printer, filament, estimatedFilamentUsage } = await request.json();
    if (!name || !googleDriveLink || typeof duration !== 'number' || !printer) {
      return NextResponse.json({ error: 'Missing required fields: name, googleDriveLink, duration, printer' }, { status: 400 });
    }
    const printData: any = {
      name,
      googleDriveLink,
      duration,
      status: 'pending',
      scheduledBy: session.user.id,
      printer,
      startedAt: null,
    };
    
    // Add optional filament fields if provided
    if (filament) {
      printData.filament = filament;
    }
    if (estimatedFilamentUsage !== undefined && estimatedFilamentUsage !== null) {
      printData.estimatedFilamentUsage = estimatedFilamentUsage;
    }
    
    const newPrint = await PrintModel.create(printData);
    return NextResponse.json({ print: newPrint }, { status: 201 });
  } catch (error) {
    console.error('Error creating print:', error);
    return NextResponse.json({ error: 'Failed to create print' }, { status: 500 });
  }
}


