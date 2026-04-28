const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const toPositiveInt = (value) => {
  const parsed = Number.parseInt(value, 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
};

const getCurrentAcademicYear = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const startYear = month >= 9 ? year : year - 1;
  return `${startYear}/${startYear + 1}`;
};

class PfeConfigController {
  // Get all PFE configurations (filtered by academic year if provided)
  async getAll(req, res) {
    try {
      const { anneeUniversitaire } = req.query;
      const where = {};

      if (anneeUniversitaire && typeof anneeUniversitaire === 'string' && anneeUniversitaire.trim()) {
        where.anneeUniversitaire = anneeUniversitaire.trim();
      } else {
        // Default to current academic year
        where.anneeUniversitaire = getCurrentAcademicYear();
      }

      const configs = await prisma.pfeConfig.findMany({
        where,
        orderBy: [{ anneeUniversitaire: 'desc' }, { nom_config: 'asc' }],
      });

      return res.status(200).json({
        success: true,
        data: configs,
      });
    } catch (err) {
      console.error('[PFE Config] getAll error:', err);
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch PFE configurations',
      });
    }
  }

  // Get a single PFE configuration by ID
  async getById(req, res) {
    try {
      const configId = toPositiveInt(req.params.id);

      if (!configId) {
        return res.status(400).json({
          success: false,
          error: 'Invalid configuration ID',
        });
      }

      const config = await prisma.pfeConfig.findUnique({
        where: { id: configId },
      });

      if (!config) {
        return res.status(404).json({
          success: false,
          error: 'Configuration not found',
        });
      }

      return res.status(200).json({
        success: true,
        data: config,
      });
    } catch (err) {
      console.error('[PFE Config] getById error:', err);
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch configuration',
      });
    }
  }

  // Create a new PFE configuration
  async create(req, res) {
    try {
      const { nom_config, valeur, description_ar, description_en, anneeUniversitaire } = req.body;
      const userId = req.user?.id;

      // Validation
      if (!nom_config || typeof nom_config !== 'string' || !nom_config.trim()) {
        return res.status(400).json({
          success: false,
          error: 'nom_config is required and must be a non-empty string',
        });
      }

      if (!valeur || typeof valeur !== 'string' || !valeur.trim()) {
        return res.status(400).json({
          success: false,
          error: 'valeur is required and must be a non-empty string',
        });
      }

      // Check for duplicate configuration name
      const existingConfig = await prisma.pfeConfig.findUnique({
        where: { nom_config: nom_config.trim() },
      });

      if (existingConfig) {
        return res.status(400).json({
          success: false,
          error: 'A configuration with this name already exists',
        });
      }

      const academicYear =
        typeof anneeUniversitaire === 'string' && anneeUniversitaire.trim()
          ? anneeUniversitaire.trim()
          : getCurrentAcademicYear();

      const newConfig = await prisma.pfeConfig.create({
        data: {
          nom_config: nom_config.trim(),
          valeur: valeur.trim().substring(0, 50), // Enforce VarChar(50)
          description_ar: description_ar ? String(description_ar).trim() : null,
          description_en: description_en ? String(description_en).trim() : null,
          anneeUniversitaire: academicYear,
          createdBy: userId || null,
        },
      });

      return res.status(201).json({
        success: true,
        data: newConfig,
        message: 'Configuration created successfully',
      });
    } catch (err) {
      console.error('[PFE Config] create error:', err);
      if (err.code === 'P2002') {
        return res.status(400).json({
          success: false,
          error: 'A configuration with this name already exists',
        });
      }
      return res.status(500).json({
        success: false,
        error: 'Failed to create configuration',
      });
    }
  }

  // Update a PFE configuration
  async update(req, res) {
    try {
      const configId = toPositiveInt(req.params.id);
      const { valeur, description_ar, description_en } = req.body;

      if (!configId) {
        return res.status(400).json({
          success: false,
          error: 'Invalid configuration ID',
        });
      }

      // Verify configuration exists
      const existingConfig = await prisma.pfeConfig.findUnique({
        where: { id: configId },
      });

      if (!existingConfig) {
        return res.status(404).json({
          success: false,
          error: 'Configuration not found',
        });
      }

      // Validation for valeur if provided
      if (valeur !== undefined) {
        if (typeof valeur !== 'string' || !valeur.trim()) {
          return res.status(400).json({
            success: false,
            error: 'valeur must be a non-empty string',
          });
        }
      }

      const updateData = {};
      if (valeur !== undefined) {
        updateData.valeur = valeur.trim().substring(0, 50);
      }
      if (description_ar !== undefined) {
        updateData.description_ar = description_ar ? String(description_ar).trim() : null;
      }
      if (description_en !== undefined) {
        updateData.description_en = description_en ? String(description_en).trim() : null;
      }

      const updatedConfig = await prisma.pfeConfig.update({
        where: { id: configId },
        data: updateData,
      });

      return res.status(200).json({
        success: true,
        data: updatedConfig,
        message: 'Configuration updated successfully',
      });
    } catch (err) {
      console.error('[PFE Config] update error:', err);
      return res.status(500).json({
        success: false,
        error: 'Failed to update configuration',
      });
    }
  }

  // Delete a PFE configuration
  async delete(req, res) {
    try {
      const configId = toPositiveInt(req.params.id);

      if (!configId) {
        return res.status(400).json({
          success: false,
          error: 'Invalid configuration ID',
        });
      }

      // Verify configuration exists
      const existingConfig = await prisma.pfeConfig.findUnique({
        where: { id: configId },
      });

      if (!existingConfig) {
        return res.status(404).json({
          success: false,
          error: 'Configuration not found',
        });
      }

      await prisma.pfeConfig.delete({
        where: { id: configId },
      });

      return res.status(200).json({
        success: true,
        data: { id: configId },
        message: 'Configuration deleted successfully',
      });
    } catch (err) {
      console.error('[PFE Config] delete error:', err);
      return res.status(500).json({
        success: false,
        error: 'Failed to delete configuration',
      });
    }
  }
}

module.exports = new PfeConfigController();
