package com.trucktrack.location.service;

import com.itextpdf.io.image.ImageDataFactory;
import com.itextpdf.kernel.colors.ColorConstants;
import com.itextpdf.kernel.colors.DeviceRgb;
import com.itextpdf.kernel.font.PdfFontFactory;
import com.itextpdf.kernel.geom.PageSize;
import com.itextpdf.kernel.pdf.PdfDocument;
import com.itextpdf.kernel.pdf.PdfWriter;
import com.itextpdf.layout.Document;
import com.itextpdf.layout.borders.Border;
import com.itextpdf.layout.element.*;
import com.itextpdf.layout.properties.HorizontalAlignment;
import com.itextpdf.layout.properties.TextAlignment;
import com.itextpdf.layout.properties.UnitValue;
import com.trucktrack.location.dto.ProofResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.Base64;

/**
 * PDF Export Service for Proof of Delivery.
 * Feature: 015-proof-of-delivery (T040, T041)
 *
 * Generates PDF documents containing signature, photos, and metadata.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class PdfExportService {

    private static final DeviceRgb PRIMARY_COLOR = new DeviceRgb(25, 118, 210);
    private static final DeviceRgb SUCCESS_COLOR = new DeviceRgb(40, 167, 69);
    private static final DeviceRgb DANGER_COLOR = new DeviceRgb(220, 53, 69);
    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm:ss")
            .withZone(ZoneId.systemDefault());

    private final DeliveryProofService proofService;

    /**
     * Generate PDF for a proof of delivery.
     */
    public byte[] generatePdf(String proofId) {
        ProofResponse proof = proofService.getProofById(java.util.UUID.fromString(proofId));
        return generatePdfFromProof(proof);
    }

    /**
     * Generate PDF from proof response.
     */
    public byte[] generatePdfFromProof(ProofResponse proof) {
        try (ByteArrayOutputStream baos = new ByteArrayOutputStream()) {
            PdfWriter writer = new PdfWriter(baos);
            PdfDocument pdfDoc = new PdfDocument(writer);
            Document document = new Document(pdfDoc, PageSize.A4);
            document.setMargins(36, 36, 36, 36);

            // Header
            addHeader(document, proof);

            // Status badge
            addStatusBadge(document, proof);

            // Signature section
            addSignatureSection(document, proof);

            // Refusal reason (if refused)
            if ("REFUSED".equals(proof.status().name()) && proof.refusalReason() != null) {
                addRefusalSection(document, proof);
            }

            // Photos section
            if (proof.photos() != null && !proof.photos().isEmpty()) {
                addPhotosSection(document, proof);
            }

            // Metadata section
            addMetadataSection(document, proof);

            // Integrity section
            addIntegritySection(document, proof);

            // Footer
            addFooter(document);

            document.close();
            return baos.toByteArray();
        } catch (Exception e) {
            log.error("Failed to generate PDF for proof {}", proof.id(), e);
            throw new RuntimeException("Failed to generate PDF", e);
        }
    }

    private void addHeader(Document document, ProofResponse proof) {
        Paragraph title = new Paragraph("PROOF OF DELIVERY")
                .setFontSize(24)
                .setBold()
                .setFontColor(PRIMARY_COLOR)
                .setTextAlignment(TextAlignment.CENTER)
                .setMarginBottom(8);
        document.add(title);

        Paragraph subtitle = new Paragraph("TruckTrack Delivery Confirmation")
                .setFontSize(12)
                .setFontColor(ColorConstants.GRAY)
                .setTextAlignment(TextAlignment.CENTER)
                .setMarginBottom(24);
        document.add(subtitle);
    }

    private void addStatusBadge(Document document, ProofResponse proof) {
        DeviceRgb statusColor = "SIGNED".equals(proof.status().name()) ? SUCCESS_COLOR : DANGER_COLOR;

        Table statusTable = new Table(1);
        statusTable.setWidth(UnitValue.createPercentValue(100));
        statusTable.setHorizontalAlignment(HorizontalAlignment.CENTER);

        Cell statusCell = new Cell()
                .add(new Paragraph(proof.statusDisplayName())
                        .setFontSize(14)
                        .setBold()
                        .setFontColor(ColorConstants.WHITE)
                        .setTextAlignment(TextAlignment.CENTER))
                .setBackgroundColor(statusColor)
                .setBorder(Border.NO_BORDER)
                .setPadding(10);
        statusTable.addCell(statusCell);

        document.add(statusTable);
        document.add(new Paragraph().setMarginBottom(24));
    }

    private void addSignatureSection(Document document, ProofResponse proof) {
        Paragraph sectionTitle = new Paragraph("Signature")
                .setFontSize(14)
                .setBold()
                .setFontColor(PRIMARY_COLOR)
                .setMarginBottom(8);
        document.add(sectionTitle);

        // Signature image
        try {
            String base64Image = proof.signatureImage();
            if (base64Image.contains(",")) {
                base64Image = base64Image.substring(base64Image.indexOf(",") + 1);
            }
            byte[] imageBytes = Base64.getDecoder().decode(base64Image);
            Image signatureImage = new Image(ImageDataFactory.create(imageBytes));
            signatureImage.setMaxWidth(300);
            signatureImage.setMaxHeight(150);
            signatureImage.setHorizontalAlignment(HorizontalAlignment.CENTER);
            signatureImage.setBorder(new com.itextpdf.layout.borders.SolidBorder(ColorConstants.LIGHT_GRAY, 1));
            signatureImage.setPadding(8);

            document.add(signatureImage);
        } catch (Exception e) {
            log.warn("Failed to add signature image to PDF", e);
            document.add(new Paragraph("[Signature image could not be loaded]")
                    .setFontColor(ColorConstants.GRAY)
                    .setItalic());
        }

        // Signer name (T052)
        if (proof.signerName() != null && !proof.signerName().isBlank()) {
            Paragraph signerName = new Paragraph("Signed by: " + proof.signerName())
                    .setFontSize(12)
                    .setTextAlignment(TextAlignment.CENTER)
                    .setMarginTop(8);
            document.add(signerName);
        }

        document.add(new Paragraph().setMarginBottom(24));
    }

    private void addRefusalSection(Document document, ProofResponse proof) {
        Paragraph sectionTitle = new Paragraph("Refusal Reason")
                .setFontSize(14)
                .setBold()
                .setFontColor(DANGER_COLOR)
                .setMarginBottom(8);
        document.add(sectionTitle);

        Paragraph reason = new Paragraph(proof.refusalReason())
                .setFontSize(12)
                .setBackgroundColor(new DeviceRgb(255, 243, 243))
                .setPadding(12)
                .setMarginBottom(24);
        document.add(reason);
    }

    private void addPhotosSection(Document document, ProofResponse proof) {
        Paragraph sectionTitle = new Paragraph("Photos (" + proof.photoCount() + ")")
                .setFontSize(14)
                .setBold()
                .setFontColor(PRIMARY_COLOR)
                .setMarginBottom(8);
        document.add(sectionTitle);

        // Create table for photos
        Table photosTable = new Table(UnitValue.createPercentArray(3));
        photosTable.setWidth(UnitValue.createPercentValue(100));

        for (var photo : proof.photos()) {
            try {
                String base64Image = photo.photoImage();
                if (base64Image.contains(",")) {
                    base64Image = base64Image.substring(base64Image.indexOf(",") + 1);
                }
                byte[] imageBytes = Base64.getDecoder().decode(base64Image);
                Image photoImage = new Image(ImageDataFactory.create(imageBytes));
                photoImage.setMaxWidth(150);
                photoImage.setMaxHeight(150);

                Cell cell = new Cell()
                        .add(photoImage)
                        .setBorder(Border.NO_BORDER)
                        .setPadding(4);
                photosTable.addCell(cell);
            } catch (Exception e) {
                log.warn("Failed to add photo to PDF", e);
            }
        }

        document.add(photosTable);
        document.add(new Paragraph().setMarginBottom(24));
    }

    private void addMetadataSection(Document document, ProofResponse proof) {
        Paragraph sectionTitle = new Paragraph("Details")
                .setFontSize(14)
                .setBold()
                .setFontColor(PRIMARY_COLOR)
                .setMarginBottom(8);
        document.add(sectionTitle);

        Table metadataTable = new Table(UnitValue.createPercentArray(new float[]{30, 70}));
        metadataTable.setWidth(UnitValue.createPercentValue(100));

        // Captured time
        addMetadataRow(metadataTable, "Captured:", DATE_FORMATTER.format(proof.capturedAt()));

        // Synced time
        addMetadataRow(metadataTable, "Synced:", DATE_FORMATTER.format(proof.syncedAt()));

        // Location
        addMetadataRow(metadataTable, "Location:",
                String.format("%.6f, %.6f", proof.latitude(), proof.longitude()));

        // GPS Accuracy
        addMetadataRow(metadataTable, "GPS Accuracy:", proof.gpsAccuracy() + "m");

        // Created by
        if (proof.createdByName() != null) {
            addMetadataRow(metadataTable, "Created by:", proof.createdByName());
        }

        // Trip ID
        addMetadataRow(metadataTable, "Trip ID:", proof.tripId().toString());

        // Proof ID
        addMetadataRow(metadataTable, "Proof ID:", proof.id().toString());

        document.add(metadataTable);
        document.add(new Paragraph().setMarginBottom(24));
    }

    private void addMetadataRow(Table table, String label, String value) {
        Cell labelCell = new Cell()
                .add(new Paragraph(label).setFontSize(10).setFontColor(ColorConstants.GRAY))
                .setBorder(Border.NO_BORDER)
                .setPaddingBottom(4);
        table.addCell(labelCell);

        Cell valueCell = new Cell()
                .add(new Paragraph(value).setFontSize(10))
                .setBorder(Border.NO_BORDER)
                .setPaddingBottom(4);
        table.addCell(valueCell);
    }

    private void addIntegritySection(Document document, ProofResponse proof) {
        Paragraph sectionTitle = new Paragraph("Integrity Verification")
                .setFontSize(12)
                .setBold()
                .setFontColor(ColorConstants.DARK_GRAY)
                .setMarginBottom(4);
        document.add(sectionTitle);

        Paragraph hash = new Paragraph("SHA-256: " + proof.integrityHash())
                .setFontSize(8)
                .setFontColor(ColorConstants.GRAY)
                .setBackgroundColor(new DeviceRgb(245, 245, 245))
                .setPadding(8);
        document.add(hash);
    }

    private void addFooter(Document document) {
        document.add(new Paragraph().setMarginTop(24));

        Paragraph footer = new Paragraph("This document was automatically generated by TruckTrack")
                .setFontSize(8)
                .setFontColor(ColorConstants.GRAY)
                .setTextAlignment(TextAlignment.CENTER);
        document.add(footer);

        Paragraph timestamp = new Paragraph("Generated on: " + DATE_FORMATTER.format(java.time.Instant.now()))
                .setFontSize(8)
                .setFontColor(ColorConstants.GRAY)
                .setTextAlignment(TextAlignment.CENTER);
        document.add(timestamp);
    }
}
