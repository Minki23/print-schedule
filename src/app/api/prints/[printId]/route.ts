import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/authOptions';
import dbConnect from '@/lib/dbConnect';
import PrintModel from '@/models/Print';
import PrinterModel from '@/models/Printer';

// Stop or start a print job
export async function PATCH(request: Request, context: any) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    await dbConnect();
    const { printId } = await context.printId;

    // Determine action from request body; if no JSON body, default to 'start'
    let action: string | undefined;
    try {
      const parsed = await request.json();
      action = parsed.action;
    } catch {
      action = undefined;
    }

    const print = await PrintModel.findById(printId).populate('printer');
    if (!print) {
      return NextResponse.json({ error: 'Print not found' }, { status: 404 });
    }

    const printerId = (print.printer as any)?._id;
    const printer = printerId ? await PrinterModel.findById(printerId) : null;

    if (action === 'stop') {
      if (print.status !== 'printing') {
        return NextResponse.json({ error: 'Print is not currently printing' }, { status: 400 });
      }
      // Mark as failed and free up printer
      print.status = 'failed';
      await print.save();
      if (printer) {
        printer.occupied = false;
        await printer.save();
      }
      return NextResponse.json({ print });
    }

    // Default action: start
    if (print.status !== 'pending') {
      return NextResponse.json({ error: 'Print cannot be started' }, { status: 400 });
    }
    if (printer) {
      printer.occupied = true;
      await printer.save();
    }
    print.status = 'printing';
    print.startedAt = new Date();
    await print.save();
    return NextResponse.json({ print });
  } catch (error) {
    console.error('Error updating print:', error);
    return NextResponse.json({ error: 'Failed to update print' }, { status: 500 });
  }
}

// Delete a print job
export async function DELETE(request: Request, { params }: { params: { printId: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.rank !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    await dbConnect();
    const { printId } = await params;
    const print = await PrintModel.findById(printId).populate('printer');
    if (!print) {
      return NextResponse.json({ error: 'Print not found' }, { status: 404 });
    }
    // Free printer if it was printing
    const printerId = (print.printer as any)?._id;
    if (print.status === 'printing' && printerId) {
      const printer = await PrinterModel.findById(printerId);
      if (printer) {
        printer.occupied = false;
        await printer.save();
      }
    }
    await PrintModel.findByIdAndDelete(printId);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting print:', error);
    return NextResponse.json({ error: 'Failed to delete print' }, { status: 500 });
  }
}
