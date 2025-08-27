import type { Express } from "express";
import express from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertGarmentSchema, bulkInsertGarmentSchema } from "@shared/schema";
import multer from "multer";
import * as XLSX from "xlsx";
import { z } from "zod";
import path from "path";
import fs from "fs";

const upload = multer({ storage: multer.memoryStorage() });

// Internal mapping for tipo_manga determination
const TIPOS_MANGA = {
  '1': 'Manga Larga',
  '2': 'Manga Corta', 
  '3': 'Manga 3/4',
  '4': 'Manga Junior',
  'L': 'Largo',
  'C': 'Corto',
  'R': 'Recto'
};

// Helper function to determine tipo_manga based on modelo
function determineTipoManga(modelo: string): string {
  if (!modelo) return '';
  
  const lastChar = modelo.slice(-1).toUpperCase();
  return TIPOS_MANGA[lastChar] || '';
}

// Configure multer for image uploads
const imageUpload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      const uploadDir = path.join(process.cwd(), 'uploads');
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      cb(null, 'garment-' + uniqueSuffix + path.extname(file.originalname));
    }
  }),
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Solo se permiten archivos de imagen'), false);
    }
  },
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

export async function registerRoutes(app: Express): Promise<Server> {

  // Get garment by code
  app.get("/api/garments/:code", async (req, res) => {
    try {
      const { code } = req.params;
      const garment = await storage.getGarmentByCode(code);

      if (!garment) {
        return res.status(404).json({
          message: "Prenda no encontrada",
          error: "GARMENT_NOT_FOUND"
        });
      }

      res.json(garment);
    } catch (error) {
      console.error("Error fetching garment:", error);
      res.status(500).json({
        message: "Error interno del servidor",
        error: "INTERNAL_ERROR"
      });
    }
  });

  // Get all garments
  app.get("/api/garments", async (req, res) => {
    try {
      const garments = await storage.getAllGarments();
      res.json(garments);
    } catch (error) {
      console.error("Error fetching garments:", error);
      res.status(500).json({
        message: "Error interno del servidor",
        error: "INTERNAL_ERROR"
      });
    }
  });

  // Upload Excel file with garments data
  app.post("/api/garments/upload", upload.single('file'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          message: "No se proporcionó archivo",
          error: "NO_FILE"
        });
      }

      console.log('Processing Excel file...');

      // Read Excel file
      const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];

      // Convert to JSON
      const rawData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

      if (rawData.length < 2) {
        return res.status(400).json({
          message: "El archivo debe contener al menos una fila de datos",
          error: "INSUFFICIENT_DATA"
        });
      }

      // Get headers and find column indices
      const headers = rawData[0] as string[];
      console.log('Headers found:', headers);

      const requiredColumns = ['CÓDIGO', 'ÁREA', 'DAMA / CAB', 'PRENDA', 'MODELO', 'TELA', 'COLOR', 'TALLA', 'FICHA DE BORDADO'];
      const columnMap: any = {};

      // Find column indices
      requiredColumns.forEach(col => {
        const index = headers.findIndex(h =>
          h && h.toString().trim().toUpperCase().includes(col.toUpperCase())
        );
        if (index === -1) {
          return res.status(400).json({
            message: `Columna requerida no encontrada: ${col}`,
            error: "MISSING_COLUMN"
          });
        }

        // Map column names to keys
        if (col === 'CÓDIGO') columnMap.codigo = index;
        else if (col === 'ÁREA') columnMap.area = index;
        else if (col === 'DAMA / CAB') columnMap.damaCab = index;
        else if (col === 'PRENDA') columnMap.prenda = index;
        else if (col === 'MODELO') columnMap.modelo = index;
        else if (col === 'TELA') columnMap.tela = index;
        else if (col === 'COLOR') columnMap.color = index;
        else if (col === 'TALLA') columnMap.talla = index;
        else if (col === 'FICHA DE BORDADO') columnMap.ficha = index;
      });

      console.log('First row of data:', rawData[1]);
      console.log('Column indices:', columnMap);

      // Process data rows
      const validGarments: any[] = [];
      const errors: string[] = [];
      const seenCodes = new Set<string>();

      for (let i = 1; i < rawData.length; i++) {
        const row = rawData[i] as any[];

        try {
          console.log(`Starting to process row ${i + 1}:`, row);

          // Create garment object
          const garmentData = {
            codigo: String(row[columnMap.codigo] || '').trim(),
            area: String(row[columnMap.area] || '').trim(),
            dama_cab: String(row[columnMap.damaCab] || '').trim(),
            prenda: String(row[columnMap.prenda] || '').trim(),
            modelo: String(row[columnMap.modelo] || '').trim(),
            tela: String(row[columnMap.tela] || '').trim(),
            color: String(row[columnMap.color] || '').trim(),
            talla: String(row[columnMap.talla] || '').trim(), // Added talla
            ficha_bordado: String(row[columnMap.ficha] || '').trim()
          };

          console.log(`Row ${i + 1} data created successfully:`, garmentData);

          // Skip empty rows
          if (!garmentData.codigo) {
            console.log(`Skipping row ${i + 1}: empty codigo`);
            continue;
          }

          console.log(`Checking codigo for row ${i + 1}: "${garmentData.codigo}" (type: ${typeof garmentData.codigo}, length: ${garmentData.codigo.length})`);

          // Check for duplicate codes in this batch
          if (seenCodes.has(garmentData.codigo)) {
            errors.push(`Fila ${i + 1}: Código duplicado '${garmentData.codigo}'`);
            continue;
          }
          seenCodes.add(garmentData.codigo);
          console.log(`Code ${garmentData.codigo} added to seen codes, continuing to validation...`);

          // Validate with schema
          console.log(`About to validate row ${i + 1}:`, garmentData);
          const validatedGarment = insertGarmentSchema.parse(garmentData);
          console.log(`Validation successful for row ${i + 1}`);

          validGarments.push(validatedGarment);
        } catch (error: any) {
          console.error(`Validation error for row ${i + 1}:`, error);
          if (error instanceof z.ZodError) {
            const fieldErrors = error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ');
            errors.push(`Fila ${i + 1}: ${fieldErrors}`);
          } else {
            errors.push(`Fila ${i + 1}: Error procesando datos`);
          }
        }
      }

      console.log(`Processed ${validGarments.length} valid garments, ${errors.length} errors`);
      console.log('Sample garments to insert:', validGarments.slice(0, 3));
      console.log('All errors:', errors);

      // Insert/Update valid garments in batches to avoid memory issues
      const batchSize = 100;
      let totalCreated = 0;
      let totalUpdated = 0;
      let totalSkipped = 0;

      try {
        for (let i = 0; i < validGarments.length; i += batchSize) {
          const batch = validGarments.slice(i, i + batchSize);
          const result = await storage.upsertGarments(batch);
          totalCreated += result.created.length;
          totalUpdated += result.updated.length;
          totalSkipped += result.skipped;
        }

        console.log(`Successfully processed ${totalCreated} new garments, ${totalUpdated} updated garments, ${totalSkipped} skipped`);
      } catch (insertError) {
        console.error('Error processing garments:', insertError);
        return res.status(500).json({
          message: "Error procesando datos en la base de datos",
          error: "DATABASE_PROCESSING_ERROR"
        });
      }

      const stats = {
        total: rawData.length - 1, // Exclude header
        created: totalCreated,
        updated: totalUpdated,
        skipped: totalSkipped,
        errors: errors.length,
        warnings: 0
      };

      console.log('Final stats:', stats);

      const message = totalCreated > 0 || totalUpdated > 0
        ? `Archivo procesado exitosamente: ${totalCreated} nuevos, ${totalUpdated} actualizados${totalSkipped > 0 ? `, ${totalSkipped} omitidos` : ''}`
        : "Archivo procesado, no se realizaron cambios";

      res.json({
        message,
        stats,
        errors: errors.slice(0, 10) // Limit errors shown
      });

    } catch (error) {
      console.error("Error processing Excel file:", error);
      res.status(500).json({
        message: "Error procesando el archivo Excel",
        error: "PROCESSING_ERROR"
      });
    }
  });

  // Create single garment
  app.post("/api/garments", async (req, res) => {
    try {
      const garmentData = insertGarmentSchema.parse(req.body);
      const garment = await storage.createGarment(garmentData);
      res.status(201).json(garment);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          message: "Datos inválidos",
          errors: error.errors
        });
      }
      console.error("Error creating garment:", error);
      res.status(500).json({
        message: "Error interno del servidor",
        error: "INTERNAL_ERROR"
      });
    }
  });

  // Upload image for garment
  app.post("/api/garments/:code/image", imageUpload.single('image'), async (req, res) => {
    try {
      const { code } = req.params;

      if (!req.file) {
        return res.status(400).json({
          message: "No se proporcionó imagen",
          error: "NO_IMAGE"
        });
      }

      // Update garment with image URL
      const imageUrl = `/uploads/${req.file.filename}`;
      const updatedGarment = await storage.updateGarmentImage(code, imageUrl);

      if (!updatedGarment) {
        // Delete uploaded file if garment not found
        fs.unlinkSync(req.file.path);
        return res.status(404).json({
          message: "Prenda no encontrada",
          error: "GARMENT_NOT_FOUND"
        });
      }

      res.json({
        message: "Imagen subida exitosamente",
        garment: updatedGarment,
        imageUrl
      });
    } catch (error) {
      console.error("Error uploading image:", error);
      if (req.file && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      res.status(500).json({
        message: "Error subiendo imagen",
        error: "UPLOAD_ERROR"
      });
    }
  });

  // Serve uploaded images statically
  app.use('/uploads', express.static(path.join(process.cwd(), 'uploads'), {
    setHeaders: (res, path) => {
      res.setHeader('Cache-Control', 'public, max-age=31536000');
    }
  }));

  const httpServer = createServer(app);
  return httpServer;
}