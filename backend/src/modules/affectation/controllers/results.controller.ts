import type { Response } from "express";
import PDFDocument from "pdfkit";
import {
  registerArabicFonts,
  resolveFont,
  textOpts,
} from "../../../utils/arabic-pdf.util";
import { parseIdParam, respondInvalidId, sendServiceError } from "./_helpers";
import fs from "fs";
import path from "path";
import * as campaignRepo from "../repositories/campaign.repository";
import * as voeuRepo from "../repositories/voeu.repository";
import { AuthRequest } from "../../../middlewares/auth.middleware";

/**
 * GET /api/v1/affectation/campaigns/:id/export/pdf
 *
 * Generates an official PDF report of the accepted affectations for the given campaign.
 * Similar header style as the user registry.
 */
export const exportCampaignResultsPdfHandler = async (req: AuthRequest, res: Response) => {
  console.log('[BACKEND] exportCampaignResultsPdfHandler called for id:', req.params.id);
  try {
    const id = parseIdParam(req.params.id);
    if (!id) return respondInvalidId(res);

    const campaign = await campaignRepo.findCampaignById(id);
    if (!campaign) {
      return res.status(404).json({
        success: false,
        error: { code: "CAMPAIGN_NOT_FOUND", message: "Campaign not found" },
      });
    }

    const acceptedVoeux = await voeuRepo.findAcceptedVoeuxForCampaign(id);
    const generatedAt = new Date();

    const fileName = `affectation-results-${id}-${generatedAt.toISOString().slice(0, 10)}.pdf`;
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);

    const pdf = new PDFDocument({
      size: "A4",
      margin: 50,
      bufferPages: true,
    });

    registerArabicFonts(pdf);
    pdf.pipe(res);

    const margin = 50;
    const rowHeight = 24;
    const tableWidth = pdf.page.width - margin * 2;
    const columns = [
      { key: "student", label: "Student", width: tableWidth * 0.35 },
      { key: "moyenne", label: "Average", width: tableWidth * 0.15 },
      { key: "specialite", label: "Assigned Specialty", width: tableWidth * 0.50 },
    ];

    const drawFormalHeader = () => {
      const topMargin = 40;
      
      // 0. Logo
      const logoPath = path.join(process.cwd(), "..", "frontend", "public", "Logo.png");
      if (fs.existsSync(logoPath)) {
        try {
          pdf.image(logoPath, margin + (tableWidth - 60) / 2, topMargin, { width: 60 });
        } catch (e) {
          console.error("Failed to draw logo:", e);
        }
      }

      const textStartY = topMargin + 70;

      // 1. Algerian Republic (Arabic)
      const republiqueText = "الجمهورية الجزائرية الديمقراطية الشعبية";
      pdf
        .font(resolveFont(republiqueText, true))
        .fontSize(12)
        .fillColor("#111827")
        .text(republiqueText, margin, textStartY, { align: "center", width: tableWidth, features: ["rtla"] });

      // 2. Ministry (Arabic)
      const ministereText = "وزارة التعليم العالي و البحث العلمي";
      pdf
        .font(resolveFont(ministereText, true))
        .fontSize(11)
        .text(ministereText, margin, textStartY + 18, { align: "center", width: tableWidth, features: ["rtla"] });

      // 3. University/Faculty/Dept (English/Mixed)
      pdf
        .font("Helvetica-Bold")
        .fontSize(10)
        .text("Université Ibn Khaldoun - Tiaret", margin, textStartY + 45, { align: "center", width: tableWidth });
      
      pdf
        .font("Helvetica")
        .fontSize(9)
        .text("Faculté des Sciences et Technologies", margin, textStartY + 58, { align: "center", width: tableWidth })
        .text("Département Informatique", margin, textStartY + 70, { align: "center", width: tableWidth });

      // 4. Report Title
      pdf
        .font("Helvetica-Bold")
        .fontSize(14)
        .fillColor("#111827")
        .text("AFFECTATION RESULTS REPORT", margin, textStartY + 95, { align: "center", width: tableWidth });

      const campaignName = campaign.nom_en || campaign.nom_ar || `Campaign #${id}`;

      pdf
        .font("Helvetica")
        .fontSize(9)
        .fillColor("#4B5563")
        .text(`Campaign: ${campaignName}`, margin, textStartY + 115, { align: "left", width: tableWidth })
        .text(`Generated: ${generatedAt.toLocaleString()}`, margin, textStartY + 115, { align: "right", width: tableWidth });

      pdf
        .moveTo(margin, textStartY + 130)
        .lineTo(pdf.page.width - margin, textStartY + 130)
        .lineWidth(1)
        .strokeColor("#D1D5DB")
        .stroke();

      return textStartY + 145;
    };

    const drawTableHeader = (startY: number) => {
      pdf.rect(margin, startY, tableWidth, rowHeight).fill("#E5E7EB");

      let x = margin;
      columns.forEach((column) => {
        pdf
          .font("Helvetica-Bold")
          .fontSize(10)
          .fillColor("#111827")
          .text(column.label, x + 8, startY + 7, {
            width: column.width - 16,
            ellipsis: true,
          });

        x += column.width;
      });

      return startY + rowHeight;
    };

    const drawTableRow = (
      row: { student: string; moyenne: string; specialite: string },
      rowY: number,
      rowIndex: number
    ) => {
      pdf
        .rect(margin, rowY, tableWidth, rowHeight)
        .fill(rowIndex % 2 === 0 ? "#FFFFFF" : "#F9FAFB");

      let x = margin;
      const values = [row.student, row.moyenne, row.specialite];

      values.forEach((value, valueIndex) => {
        const cellFont = resolveFont(value);
        const cellOpts = textOpts(value, {
          width: columns[valueIndex].width - 16,
          ellipsis: true,
        });
        pdf
          .font(cellFont)
          .fontSize(9)
          .fillColor("#1F2937")
          .text(value, x + 8, rowY + 7, cellOpts);

        x += columns[valueIndex].width;
      });
    };

    let cursorY = drawFormalHeader();
    cursorY = drawTableHeader(cursorY);

    acceptedVoeux.forEach((v, rowIndex) => {
      const studentName = `${v.etudiant?.user?.prenom} ${v.etudiant?.user?.nom}`;
      const moyenne = String(v.etudiant?.moyenne || "0.00");
      const specialiteName = v.specialite?.nom_en || v.specialite?.nom_ar || "N/A";

      const footerReserve = 44;
      if (cursorY + rowHeight > pdf.page.height - margin - footerReserve) {
        pdf.addPage();
        cursorY = drawFormalHeader();
        cursorY = drawTableHeader(cursorY);
      }

      drawTableRow({ student: studentName, moyenne, specialite: specialiteName }, cursorY, rowIndex);
      cursorY += rowHeight;
    });

    const pageRange = pdf.bufferedPageRange();
    for (let pageIndex = 0; pageIndex < pageRange.count; pageIndex += 1) {
      pdf.switchToPage(pageIndex);
      pdf
        .font("Helvetica")
        .fontSize(9)
        .fillColor("#6B7280")
        .text(`Page ${pageIndex + 1} of ${pageRange.count}`, 0, pdf.page.height - 30, {
          align: "center",
          width: pdf.page.width,
        });
    }

    pdf.end();
  } catch (error) {
    sendServiceError(res, error, "Failed to export affectation results PDF");
  }
};
