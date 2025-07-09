import dbConnect from '@/lib/dbConnect';
import { NextResponse } from 'next/server';
import FilamentModel from '@/models/Filament'

export async function GET(request: Request) {
    try {
        await dbConnect();
        const filaments = await FilamentModel.find()
        return NextResponse.json({filaments: filaments})
    } catch (error) {
        console.error('Error fetching filaments:', error);
        return NextResponse.json({ error: 'Failed to fetch filaments' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        await dbConnect();
        const data = await request.json();
        const newFilament = new FilamentModel(data);
        await newFilament.save();
        return NextResponse.json({ message: 'Filament added successfully' }, { status: 201 });
    } catch (error) {
        console.error('Error adding filament:', error);
        return NextResponse.json({ error: 'Failed to add filament' }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    try {
        await dbConnect();
        const { id } = await request.json();
        await FilamentModel.findByIdAndDelete(id);
        return NextResponse.json({ message: 'Filament deleted successfully' }, { status: 200 });
    } catch (error) {
        console.error('Error deleting filament:', error);
        return NextResponse.json({ error: 'Failed to delete filament' }, { status: 500 });
    }
}

export async function PATCH(request: Request) {
    try {
        await dbConnect();
        const { id, ...updateData } = await request.json();
        await FilamentModel.findByIdAndUpdate(id, updateData);
        return NextResponse.json({ message: 'Filament updated successfully' }, { status: 200 });
    } catch (error) {
        console.error('Error updating filament:', error);
        return NextResponse.json({ error: 'Failed to update filament' }, { status: 500 });
    }
}
