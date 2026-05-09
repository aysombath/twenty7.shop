import { NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ success: false, error: "No file provided" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const uploadResponse = await new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        { folder: 'precision-atelier/products' },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      ).end(buffer);
    });

    const result = uploadResponse as any;

    return NextResponse.json({
      success: true,
      url: result.secure_url,
      publicId: result.public_id
    });
  } catch (error: any) {
    console.error("Cloudinary upload failure:", error);
    return NextResponse.json({
      success: false,
      error: "Cloudinary upload unsuccessful.",
      details: error.message
    }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { url } = await request.json();
    if (!url) return NextResponse.json({ success: false, error: "Missing URL." });

    // Extract publicId from URL
    // Format: .../v1/folder/id.jpg -> folder/id
    const parts = url.split('/');
    const uploadIndex = parts.indexOf('upload');
    if (uploadIndex === -1) return NextResponse.json({ success: false, error: "Not a Cloudinary URL." });

    // The public ID is everything after the version marker (v12345...)
    const afterUpload = parts.slice(uploadIndex + 2).join('/');
    const publicId = afterUpload.split('.')[0]; // remove extension

    console.log("Purging Cloudinary asset:", publicId);
    const result = await cloudinary.uploader.destroy(publicId);

    return NextResponse.json({ success: true, result });
  } catch (error: any) {
    console.error("Cloudinary purge failure:", error);
    return NextResponse.json({ success: false, error: "Purge failed." }, { status: 500 });
  }
}
