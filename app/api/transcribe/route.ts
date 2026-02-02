import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';
import OpenAI from 'openai';
import fs from 'fs';
import path from 'path';
import os from 'os';

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
    let tempFilePath: string | null = null;

    try {
        const { recordingId } = await request.json();

        if (!recordingId) {
            return NextResponse.json(
                { error: 'Missing recordingId' },
                { status: 400 }
            );
        }

        // Get recording from database
        const { data: recording, error: fetchError } = await supabaseAdmin
            .from('voice_recordings')
            .select('file_url, step_number')
            .eq('id', recordingId)
            .single();

        if (fetchError || !recording) {
            return NextResponse.json(
                { error: 'Recording not found' },
                { status: 404 }
            );
        }

        // Update status to processing
        await supabaseAdmin
            .from('voice_recordings')
            .update({ processing_status: 'processing' })
            .eq('id', recordingId);

        // Detect path from URL
        // Expected format: .../voice-recordings/sessionId/step-X-timestamp.webm
        const urlParts = recording.file_url.split('/voice-recordings/');
        if (urlParts.length < 2) {
            throw new Error('Invalid file URL format');
        }
        const storagePath = urlParts[1];

        console.log('Downloading from storage path:', storagePath);

        // Download audio file using authenticated admin client
        const { data: fileData, error: downloadError } = await supabaseAdmin.storage
            .from('voice-recordings')
            .download(storagePath);

        if (downloadError || !fileData) {
            console.error('Download error:', downloadError);
            throw new Error('Failed to download file from Supabase');
        }

        const audioBuffer = Buffer.from(await fileData.arrayBuffer());

        // Detect file extension from path
        const fileExt = storagePath.split('.').pop() || 'webm';

        // Save to temp file
        tempFilePath = path.join(os.tmpdir(), `recording_${recordingId}.${fileExt}`);
        fs.writeFileSync(tempFilePath, audioBuffer);

        console.log('Saved temp file:', tempFilePath, 'size:', audioBuffer.length);

        // Use OpenAI SDK with file stream
        const transcription = await openai.audio.transcriptions.create({
            file: fs.createReadStream(tempFilePath),
            model: 'whisper-1',
            language: 'en',
        });

        const transcript = transcription.text;
        console.log('Transcription successful:', transcript.substring(0, 100));

        // Save transcript to database
        const { error: updateError } = await supabaseAdmin
            .from('voice_recordings')
            .update({
                transcript,
                processing_status: 'completed',
                processed_at: new Date().toISOString(),
            })
            .eq('id', recordingId);

        if (updateError) {
            throw updateError;
        }

        return NextResponse.json({
            success: true,
            transcript,
        });

    } catch (error) {
        console.error('Transcription error:', error);
        return NextResponse.json(
            { error: 'Transcription failed' },
            { status: 500 }
        );
    } finally {
        // Clean up temp file
        if (tempFilePath && fs.existsSync(tempFilePath)) {
            fs.unlinkSync(tempFilePath);
        }
    }
}
