import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import PrinterModel from '@/models/Printer';
import FilamentModel from '@/models/Filament';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/authOptions';

export async function GET(request: Request) {
  try {
    await dbConnect();
    
    FilamentModel;
    
    await PrinterModel.updateMany(
      { supportedFilamentDiameters: { $exists: false } },
      { $set: { supportedFilamentDiameters: [1.75] } }
    );
    
    await PrinterModel.updateMany(
      { nozzleSize: { $exists: false } },
      { $set: { nozzleSize: 0.4 } }
    );
    
    const printers = await PrinterModel.find({})
      .populate('possibleFilaments')
      .sort({ name: 1 });
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
    
    // Ensure models are registered
    FilamentModel;

    const { name, location, supportedFilamentDiameters, nozzleSize } = await request.json();
    
    // Validate required fields
    if (!name || !location || !supportedFilamentDiameters || !nozzleSize) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 });
    }
    
    // Find compatible filaments based on diameter
    const compatibleFilaments = await FilamentModel.find({
      diameter: { $in: supportedFilamentDiameters }
    });

    const newPrinter = new PrinterModel({
      name,
      location,
      supportedFilamentDiameters,
      nozzleSize,
      possibleFilaments: compatibleFilaments.map(f => f._id)
    });
    
    await newPrinter.save();
    
    const populatedPrinter = await PrinterModel.findById(newPrinter._id)
      .populate('possibleFilaments');
    
    console.log('Newly created printer:', populatedPrinter);
    return NextResponse.json({ 
      message: 'Drukarka została dodana pomyślnie',
      printer: populatedPrinter 
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating printer:', error);
    return NextResponse.json({ error: 'Failed to create printer' }, { status: 500 });
  }
}


