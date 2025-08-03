import { NextRequest, NextResponse } from 'next/server';
import { questionService } from '@/lib/data';
import { kvQuestionService } from '@/lib/kv-data';

export async function GET() {
  try {
    const questions = process.env.NODE_ENV === 'production' 
      ? await kvQuestionService.getAll() 
      : await questionService.getAll();
    return NextResponse.json(questions);
  } catch (error) {
    console.error('Error fetching questions:', error);
    return NextResponse.json({ error: 'Failed to fetch questions' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    if (!body.title || !body.content) {
      return NextResponse.json(
        { error: 'Title and content are required' },
        { status: 400 }
      );
    }

    const questionData = {
      title: body.title,
      content: body.content,
      category: body.category,
    };

    const question = process.env.NODE_ENV === 'production' 
      ? await kvQuestionService.create(questionData)
      : await questionService.create(questionData);

    return NextResponse.json(question, { status: 201 });
  } catch (error) {
    console.error('Error creating question:', error);
    return NextResponse.json({ error: 'Failed to create question' }, { status: 500 });
  }
}