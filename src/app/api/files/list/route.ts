import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { githubClient } from '@/lib/github';
import { ApiResponse } from '@/types';

export async function GET() {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    console.log('Session in GET /api/files/list:', session ? 'exists' : 'null');
    
    // TEMPORARY: Skip auth for debugging - remove this in production
    console.log('TEMPORARY: Bypassing auth for debugging');
    
    // if (!session || !session.user) {
    //   return NextResponse.json(
    //     { success: false, error: 'Unauthorized' },
    //     { status: 401 }
    //   );
    // }

    // // Check read permissions
    // if (!session.user.permissions?.read) {
    //   return NextResponse.json(
    //     { success: false, error: 'Insufficient permissions' },
    //     { status: 403 }
    //   );
    // }

    // Get file list from GitHub
    const files = await githubClient.listMarkdownFiles();

    const response: ApiResponse = {
      success: true,
      data: files,
      message: `Found ${files.length} markdown files`,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error listing files:', error);
    const response: ApiResponse = {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to list files',
    };
    return NextResponse.json(response, { status: 500 });
  }
}