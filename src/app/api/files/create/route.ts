import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { githubClient } from '@/lib/github';
import { ApiResponse, FrontmatterData } from '@/types';

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check write permissions
    if (!session.user.permissions?.write) {
      return NextResponse.json(
        { success: false, error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { filename, content, frontmatter } = body;

    // Validate required fields
    if (!filename || typeof filename !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Missing or invalid filename' },
        { status: 400 }
      );
    }

    if (!content || typeof content !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Missing or invalid content' },
        { status: 400 }
      );
    }

    if (!frontmatter || typeof frontmatter !== 'object') {
      return NextResponse.json(
        { success: false, error: 'Missing or invalid frontmatter' },
        { status: 400 }
      );
    }

    // Validate filename format
    if (!/^[a-zA-Z0-9._-]+\.md$/.test(filename)) {
      return NextResponse.json(
        { success: false, error: 'Invalid filename format. Must be alphanumeric with .md extension' },
        { status: 400 }
      );
    }

    // Validate content length
    if (content.length > 1000000) {
      return NextResponse.json(
        { success: false, error: 'Content too large. Maximum 1MB allowed' },
        { status: 400 }
      );
    }

    // Add author information from session
    const enhancedFrontmatter: FrontmatterData = {
      ...frontmatter,
      author: session.user.username || session.user.name || 'unknown',
    };

    // Create file in GitHub
    const result = await githubClient.createFile(filename, content, enhancedFrontmatter);

    const response: ApiResponse = {
      success: true,
      data: result,
      message: result.message,
    };

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    console.error('Error creating file:', error);
    const response: ApiResponse = {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create file',
    };
    return NextResponse.json(response, { status: 500 });
  }
}