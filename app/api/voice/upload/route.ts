import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();
        const file = formData.get('file') as File;
        const sessionId = formData.get('sessionId') as string;
        const stepNumber = formData.get('stepNumber') as string;

        if (!file || !sessionId || !stepNumber) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        // Get file extension from original filename or default to webm
        const originalName = file.name || 'recording.webm';
        const ext = originalName.split('.').pop() || 'webm';

        // Get file contents as ArrayBuffer
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        console.log('Uploading file:', originalName, 'size:', buffer.length, 'bytes');

        // Generate unique filename
        const fileName = `${sessionId}/step-${stepNumber}-${Date.now()}.${ext}`;

        // Upload to Supabase Storage
        const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
            .from('voice-recordings')
            .upload(fileName, buffer, {
                contentType: file.type || 'audio/webm',
                upsert: true,
            });

        if (uploadError) {
            console.error('Upload error:', uploadError);
            return NextResponse.json(
                { error: 'Failed to upload file' },
                { status: 500 }
            );
        }

        // Get public URL
        const { data: { publicUrl } } = supabaseAdmin.storage
            .from('voice-recordings')
            .getPublicUrl(fileName);

        // Save recording metadata to database
        const { data: recordingData, error: dbError } = await supabaseAdmin
            .from('voice_recordings')
            .insert({
                session_id: sessionId,
                step_number: parseInt(stepNumber),
                file_url: publicUrl,
                duration: 0, // Will be updated later
                processing_status: 'pending',
            })
            .select()
            .single();

        if (dbError) {
            console.error('Database error:', dbError);
            return NextResponse.json(
                { error: 'Failed to save recording metadata' },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            url: publicUrl,
            recordingId: recordingData.id,
        });

    } catch (error) {
        console.error('API error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
