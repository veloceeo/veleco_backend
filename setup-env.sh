#!/bin/bash
# Add all required environment variables to Vercel

echo "Adding environment variables to Vercel..."

# Add DATABASE_URL with correct postgresql:// protocol
echo "postgresql://7b93c3d02919e3b578b54ff08d48cc14735f4a18754a9e9932bccf556b0efba7:sk_gRbhgFir2lAyN7zAvTjj6@db.prisma.io:5432/?sslmode=require" | vercel env add DATABASE_URL production

# Add other required variables
echo "veleco-secret" | vercel env add JWT_SECRET production
echo "di6imgcup" | vercel env add CLOUDINARY_CLOUD_NAME production
echo "789913786143893" | vercel env add CLOUDINARY_API_KEY production
echo "md7Fovy7DAp-U75y6IXTSfBLT3c" | vercel env add CLOUDINARY_API_SECRET production
echo "production" | vercel env add NODE_ENV production

echo "Environment variables added successfully!"
