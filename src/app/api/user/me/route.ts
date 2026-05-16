import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import dbConnect from '@/lib/db';
import User from '@/models/User';

const JWT_SECRET = process.env.JWT_SECRET || 'your_fallback_secret';

// Helper: Upload to ImageKit using their REST API (no SDK needed)
async function uploadToImageKit(base64Data: string, fileName: string): Promise<string> {
  const privateKey = process.env.IMAGEKIT_PRIVATE_KEY || '';
  const authHeader = 'Basic ' + Buffer.from(privateKey + ':').toString('base64');

  const formData = new FormData();
  formData.append('file', base64Data);
  formData.append('fileName', fileName);
  formData.append('folder', '/ai-agent/profiles');

  const response = await fetch('https://upload.imagekit.io/api/v1/files/upload', {
    method: 'POST',
    headers: {
      'Authorization': authHeader,
    },
    body: formData,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`ImageKit upload failed: ${response.status} ${errorText}`);
  }

  const result = await response.json();
  return result.url;
}

export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    let userId: string;
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
      userId = decoded.userId;
    } catch (err) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    await dbConnect();
    const user = await User.findById(userId).select('-password');
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json(user);
  } catch (error: any) {
    console.error('Fetch user error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    let userId: string;
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
      userId = decoded.userId;
    } catch (err) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const { profilePicture, healthProfile } = await req.json();

    await dbConnect();
    const updateData: any = {};

    if (profilePicture) {
      let imageUrl = profilePicture;
      // Upload to ImageKit if it's a base64/data URL string
      if (profilePicture.startsWith('data:image')) {
        try {
          imageUrl = await uploadToImageKit(profilePicture, `profile_${userId}`);
        } catch (uploadError: any) {
          console.error('ImageKit upload error:', uploadError.message);
          return NextResponse.json({ error: 'Failed to upload image' }, { status: 500 });
        }
      }
      updateData.profilePicture = imageUrl;
    }

    if (healthProfile) {
      updateData.healthProfile = healthProfile;
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { $set: updateData },
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json(user);
  } catch (error: any) {
    console.error('Update profile error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
