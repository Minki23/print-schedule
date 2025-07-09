import dbConnect from '@/lib/dbConnect';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/authOptions';
import PrinterModel from '@/models/Printer';
import FilamentModel from '@/models/Filament';

export async function GET(request: Request, { params }: { params: Promise<{ printerId: string }> }) {
    try {
        await dbConnect();
        const { printerId } = await params;
        
        if (!printerId) {
            return NextResponse.json({ error: 'Printer ID is required' }, { status: 400 });
        }
        
        const printer = await PrinterModel.findById(printerId)
            .populate('possibleFilaments');
        
        if (!printer) {
            return NextResponse.json({ error: 'Printer not found' }, { status: 404 });
        }
        
        return NextResponse.json({ printer });
    } catch (error) {
        console.error('Error fetching printer:', error);
        return NextResponse.json({ error: 'Failed to fetch printer' }, { status: 500 });
    }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ printerId: string }> }) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user || session.user.rank !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        
        await dbConnect();
        
        // Ensure models are registered
        FilamentModel;
        
        const { printerId } = await params;
        
        if (!printerId) {
            return NextResponse.json({ error: 'Printer ID is required' }, { status: 400 });
        }
        
        const data = await request.json();
        const { name, supportedFilamentDiameters, nozzleSize } = data;
        
        // Validate required fields
        if (!name || !supportedFilamentDiameters || !nozzleSize) {
            return NextResponse.json({ error: 'All fields are required' }, { status: 400 });
        }
        
        // Find compatible filaments based on diameter
        const compatibleFilaments = await FilamentModel.find({
            diameter: { $in: supportedFilamentDiameters }
        });
        
        const updatedPrinter = await PrinterModel.findByIdAndUpdate(
            printerId,
            {
                name,
                supportedFilamentDiameters,
                nozzleSize,
                possibleFilaments: compatibleFilaments.map(f => f._id)
            },
            { new: true }
        ).populate('possibleFilaments');
        
        if (!updatedPrinter) {
            return NextResponse.json({ error: 'Printer not found' }, { status: 404 });
        }
        
        return NextResponse.json({ 
            message: 'Drukarka została zaktualizowana pomyślnie',
            printer: updatedPrinter 
        });
    } catch (error) {
        console.error('Error updating printer:', error);
        return NextResponse.json({ error: 'Failed to update printer' }, { status: 500 });
    }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ printerId: string }> }) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user || session.user.rank !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        
        await dbConnect();
        const { printerId } = await params;
        
        if (!printerId) {
            return NextResponse.json({ error: 'Printer ID is required' }, { status: 400 });
        }
        
        const deletedPrinter = await PrinterModel.findByIdAndDelete(printerId);
        
        if (!deletedPrinter) {
            return NextResponse.json({ error: 'Printer not found' }, { status: 404 });
        }
        
        return NextResponse.json({ message: 'Drukarka została usunięta pomyślnie' });
    } catch (error) {
        console.error('Error deleting printer:', error);
        return NextResponse.json({ error: 'Failed to delete printer' }, { status: 500 });
    }
}
