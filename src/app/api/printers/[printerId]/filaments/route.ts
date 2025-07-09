import dbConnect from '@/lib/dbConnect';
import { NextResponse } from 'next/server';
import PrinterModel from '@/models/Printer';
import FilamentModel from '@/models/Filament';

export async function GET(request: Request, { params }: { params: Promise<{ printerId: string }> }) {
    try {
        await dbConnect();
        
        // Ensure models are registered
        FilamentModel;
        
        const { printerId } = await params;
        if (!printerId) {
            return NextResponse.json({ error: 'Printer ID is required' }, { status: 400 });
        }
        
        const printer = await PrinterModel.findById(printerId);
        
        if (!printer) {
            return NextResponse.json({ error: 'Printer not found' }, { status: 404 });
        }
        
        // Get filaments that match the printer's supported diameters
        const filaments = await FilamentModel.find({
            diameter: { $in: printer.supportedFilamentDiameters || [1.75] }
        });
        
        return NextResponse.json({ filaments });
    } catch (error) {
        console.error('Error fetching printer filaments:', error);
        return NextResponse.json({ error: 'Failed to fetch filaments' }, { status: 500 });
    }
}
