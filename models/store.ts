import express from "express";
import cloudinary, { UploadStream } from "cloudinary";
import { PrismaClient } from "../db/generated/prisma";
import { authMiddleware } from "../models/auth/middleware";
import multer from "multer";
import dotenv from "dotenv";

dotenv.config();

const store = express.Router();
const prisma = new PrismaClient();

// Validate required environment variables
const requiredEnvVars = [
    'CLOUDINARY_CLOUD_NAME',
    'CLOUDINARY_API_KEY',
    'CLOUDINARY_API_SECRET'
];

const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
if (missingVars.length > 0) {
    console.error('Missing required environment variables:', missingVars);
    console.error('Please check your .env file and ensure all Cloudinary credentials are set.');
}

// Configure Cloudinary
cloudinary.v2.config({
    cloud_name: "di6imgcup",
    api_key: "789913786143893",
    api_secret: "md7Fovy7DAp-U75y6IXTSfBLT3c"
});

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB limit
    },
    fileFilter: (req, file, cb) => {
        // Accept images and documents
        if (file.mimetype.startsWith('image/') ||
            file.mimetype === 'application/pdf' ||
            file.mimetype === 'application/msword' ||
            file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type. Only images, PDFs, and Word documents are allowed.'));
        }
    }
});

store.use(express.json());
// Store Endpoints
store.post("/create", authMiddleware, upload.single("file"), async (req, res) => {
    const { name, address, phone, email, pan_number, adhar_number, gst_number, store_open, store_close, store_type } = req.body;
    const store = await prisma.store.create({
        data: {
            name,
            address,
            phone,
            email,
            pan_number,
            adhar_number,
            gst_number,
            store_open,
            store_close,
            store_type,
            user_id: req.userId,
            longitude: req.body.longitude || null,
            latitude: req.body.latitude || null
        },        select: {
            name: true,
            address: true,
            phone: true,
            email: true,
            pan_number: true,
            adhar_number: true,
            gst_number: true,
            store_open: true,
            store_close: true,
            store_type: true,
            user_id: true,
            latitude: true,
            longitude: true
        }
    })
    res.json({ message: "store created", store: store.name });
})
store.get("/", authMiddleware, async (req, res) => {
    const store = await prisma.store.findFirst({
        where: {
            user_id: req.userId
        },        select: {
            name: true,
            address: true,
            phone: true,
            email: true,
            store_open: true,
            store_close: true,
            store_type: true,
            store_status: true,
            latitude: true,
            longitude: true
        }
    })
    res.json({ message: "store fetched", store: store });
})
store.put("/update", authMiddleware, async (req, res) => {
    const store = await prisma.store.findFirst({
        where: { user_id: req.userId as number },
        select: {
            id: true,
        }
    })
    if (!store) {
        res.status(404).json({ message: "Store not found" });
        return;
    }    const { name, address, phone, email, pan_number, adhar_number, gst_number, store_open, store_close, store_type, latitude, longitude } = req.body;

    const updateStore = await prisma.store.update({
        where: { id: store.id },
        data: { 
            name, 
            address, 
            phone, 
            email, 
            pan_number, 
            adhar_number, 
            gst_number, 
            store_open, 
            store_close, 
            store_type,
            latitude: latitude || null,
            longitude: longitude || null
        }
    })
    res.json({ message: "store updated", store: updateStore.name });
})
store.delete("/delete", authMiddleware, async (req, res) => {
    // First, find the store by user_id to get its id
    const storeToDelete = await prisma.store.findFirst({
        where: { user_id: req.userId as number },
        select: { id: true, name: true }
    });    if (!storeToDelete) {
         res.status(404).json({ message: "Store not found" });
    }

    const deletedStore = await prisma.store.delete({
        where: { id: storeToDelete?.id },
        select: { name: true }
    });
    res.json({ message: "store deleted", store: deletedStore.name });
})

// Route to upload multiple files
store.post("/files", authMiddleware, upload.array('files', 5), async (req, res) => {
    try {        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ error: 'No files uploaded' });
        }

        const uploadPromises = (req.files as Express.Multer.File[]).map(async (file: Express.Multer.File) => {
            return new Promise<any>((resolve, reject) => {
                const uploadStream = cloudinary.v2.uploader.upload_stream(
                    {
                        folder: 'store-documents',
                        resource_type: 'auto',
                    },
                    (error, result) => {
                        if (error) reject(error);
                        else resolve({
                            originalName: file.originalname,
                            size: file.size,
                            mimetype: file.mimetype,
                            cloudinaryUrl: result?.secure_url,
                            cloudinaryId: result?.public_id
                        });
                    }
                );

                uploadStream.end(file.buffer);
            });
        });

        const uploadedFiles = await Promise.all(uploadPromises);

        res.json({
            message: 'Files uploaded successfully',
            files: uploadedFiles
        });
    } catch (error) {
        console.error('Multiple file upload error:', error);
        res.status(500).json({ error: 'Failed to upload files' });
    }
});
//Aadhar-card

store.post("/file", upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
             res.status(400).json({ error: 'No file uploaded' });
        }

        // Upload to Cloudinary
        const result = await new Promise<any>((resolve, reject) => {
            const uploadStream = cloudinary.v2.uploader.upload_stream(
                {
                    folder: 'store-documents',
                    resource_type: 'auto',
                },
                (error, result) => {
                    if (error) reject(error);
                    else resolve(result);
                }
            );

            uploadStream.end(req.file!.buffer);
        });

        // Find the store for the current user
        const existingStore = await prisma.store.findFirst({
            where: {
                user_id: req.userId
            }
        });        if (!existingStore) {
             res.status(404).json({ error: 'Store not found for this user' });
        }

        // Update the store with the uploaded file URL
        const updatedStore = await prisma.store.update({
            where: {
                id: existingStore?.id
            },
            data: {
                adhar_number: result.secure_url
            }
        });

        res.json({
            message: 'File uploaded successfully',
            file: {
                originalName: req.file?.originalname,
                size: req.file?.size,
                mimetype: req.file?.mimetype,
                cloudinaryUrl: result.secure_url,
                cloudinaryId: result.public_id,
                store_data: updatedStore
            }
        });
    } catch (error) {
        console.error('File upload error:', error);
        res.status(500).json({ error: 'Failed to upload file' });
    }
});

//Route For Pan Upload


store.post("/pan", upload.single('file'), async (req, res) => {

    try {
        if (!req.file) {
            res.status(400).json({ error: 'No file uploaded' });
        }

        const result = await new Promise<any>((resolve, reject) => {
            const uploadStream = cloudinary.v2.uploader.upload_stream(
                {
                    folder: 'store-documents',
                    resource_type: 'auto',
                },
                (error, result) => {
                    if (error) reject(error);
                    else resolve(result);
                }
            );

            uploadStream.end(req.file!.buffer);
        });        const existingPan = await prisma.store.findFirst({
            where: {
                user_id: req.userId
            }
        });
        if (!existingPan) {
            return res.status(404).json({ error: 'Store not found for this user' });
        }
        const uploadPan = await prisma.store.update({
            where: {
                id: existingPan?.id
            },
            data: {
                pan_number: result.secure_url
            }
        })
        res.json({
            file: {
                uploaded: uploadPan
            }
        })

    }
    catch (e) {
        console.log(e)
        res.send("Error");
    };
  }  )

// Route to delete file from Cloudinary
store.delete("/file/:cloudinaryId", authMiddleware, async (req, res) => {
    try {
        const { cloudinaryId } = req.params;

        if (!cloudinaryId) {
            return res.status(400).json({ error: 'Cloudinary ID is required' });
        }

        const result = await cloudinary.v2.uploader.destroy(cloudinaryId);

        if (result.result === 'ok') {
            res.json({ message: 'File deleted successfully' });
        } else {
            res.status(400).json({ error: 'Failed to delete file' });
        }
    } catch (error) {
        console.error('File deletion error:', error);
        res.status(500).json({ error: 'Failed to delete file' });
    }
});

// Route to get all files uploaded by the user
store.get("/files", authMiddleware, async (req, res) => {
    try {
        const store = await prisma.store.findFirst({
            where: { user_id: req.userId },
            select: {
                id: true,
                adhar_number: true,
                pan_number: true
            }
        });

        if (!store) {
            return res.status(404).json({ error: 'Store not found for this user' });
        }

        const files = [];
        if (store.adhar_number) {
            files.push({
                type: 'Aadhar',
                url: store.adhar_number
            });
        }
        if (store.pan_number) {
            files.push({
                type: 'PAN',
                url: store.pan_number
            });
        }

        res.json({ files });
    } catch (error) {
        console.error('Error fetching files:', error);
        res.status(500).json({ error: 'Failed to fetch files' });
    }
}
)

export default store;