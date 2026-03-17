import express from "express";
import multer from "multer";
import { v2 as cloudinary } from "cloudinary";
import { pool } from "../db.js";
import authMiddleware from "../middleware/authMiddleware.js";
import os from "os";
import fs from "fs";
import path from "path";

const router = express.Router();

// Configuration
cloudinary.config({ 
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
    api_key: process.env.CLOUDINARY_API_KEY, 
    api_secret: process.env.CLOUDINARY_API_SECRET
});

const upload = multer({ 
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 } // 10MB
});

// GET all files for a user/tenant
router.get("/", authMiddleware, async (req, res) => {
    try {
        const { tenantId } = req.user;
        
        const result = await pool.query(
            `SELECT f.id, f.name, f.type, f.size, f.url, f.created_at, 
             e.first_name || ' ' || e.last_name as owner_name 
             FROM files f
             LEFT JOIN employees e ON f.user_id = e.user_id
             WHERE f.tenant_id = $1
             ORDER BY f.created_at DESC`,
            [tenantId]
        );
        
        res.json(result.rows);
    } catch (error) {
        console.error("Error fetching files:", error);
        res.status(500).json({ message: "Server error fetching files" });
    }
});

// POST upload file
router.post("/upload", authMiddleware, upload.single("file"), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: "No file uploaded" });
        }

        const { tenantId, userId } = req.user;
        const originalName = req.file.originalname;
        
        // Write the buffer to a temp file locally to keep the correct file extension for Cloudinary
        const tempFilePath = path.join(os.tmpdir(), `${Date.now()}_${originalName.replace(/\s+/g, '_')}`);
        fs.writeFileSync(tempFilePath, req.file.buffer);

        // Get extension as type
        // Truncate the type so it definitely fits into db
        const rawType = req.file.mimetype.split('/')[1] || 'document';
        const type = rawType.substring(0, 48);
        const size = req.file.size;

        // Upload to cloudinary
        let resourceType = "auto";
        if (req.file.mimetype.includes('pdf')) {
            // Cloudinary requires PDF to be uploaded as 'image' or 'auto' to be openable natively in browsers 
            // without forcing a raw binary download, which corrupts the view.
            resourceType = "image";
        } else if (req.file.mimetype.includes('document') || req.file.mimetype.includes('text') || req.file.mimetype.includes('application/')) {
            resourceType = "raw";
        }
        
        const uploadResult = await cloudinary.uploader.upload(tempFilePath, {
            folder: `saas_files/${tenantId}`,
            resource_type: resourceType,
            use_filename: true,
            unique_filename: true
        });

        // Clean up temp file
        fs.unlinkSync(tempFilePath);

        // Save to DB
        const result = await pool.query(
            `INSERT INTO files (tenant_id, user_id, name, type, size, url, cloudinary_id)
             VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
            [tenantId, userId, originalName, type, size, uploadResult.secure_url, uploadResult.public_id]
        );
        
        // Fetch owner name to return it to UI
        const employeeResult = await pool.query(
            `SELECT first_name, last_name FROM employees WHERE user_id = $1`,
            [userId]
        );
        const employee = employeeResult.rows[0];
        const owner_name = employee ? `${employee.first_name} ${employee.last_name}` : 'Unknown';

        res.status(201).json({
            ...result.rows[0],
            owner_name
        });

    } catch (error) {
        console.error("Error uploading file:", error);
        res.status(500).json({ message: "Server error uploading file" });
    }
});

// DELETE file
router.delete("/:id", authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const { tenantId } = req.user;

        // Ensure user has access to file and get cloudinary_id
        const fileResult = await pool.query(
            "SELECT cloudinary_id FROM files WHERE id = $1 AND tenant_id = $2",
            [id, tenantId]
        );

        if (fileResult.rows.length === 0) {
            return res.status(404).json({ message: "File not found" });
        }

        const cloudinaryId = fileResult.rows[0].cloudinary_id;

        // Delete from cloudinary
        await cloudinary.uploader.destroy(cloudinaryId, { resource_type: "raw" }); // 'raw' or 'image' or 'video' but Cloudinary SDK handles it or we can pass default
        // Often we need to delete with resource_type auto, but cloudinary destroy handles common ones. We might need specific resource_type.
        // For general safety, just let it destroy. If it fails due to resource_type, we wrap in try/catch or explicitly check type.
        // We'll skip passing resource_type or pass raw, or use try catch for Cloudinary.
        try {
             await cloudinary.uploader.destroy(cloudinaryId, {resource_type: "image"});
             await cloudinary.uploader.destroy(cloudinaryId, {resource_type: "raw"});
             await cloudinary.uploader.destroy(cloudinaryId, {resource_type: "video"});
        } catch (e) {
             console.error("Cloudinary delete failed but continuing DB delete", e);
        }

        // Delete from DB
        await pool.query("DELETE FROM files WHERE id = $1", [id]);

        res.json({ message: "File deleted successfully" });
    } catch (error) {
        console.error("Error deleting file:", error);
        res.status(500).json({ message: "Server error deleting file" });
    }
});

export default router;
