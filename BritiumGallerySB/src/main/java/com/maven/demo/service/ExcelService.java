// ExcelService.java
package com.maven.demo.service;

import com.maven.demo.entity.*;
import com.maven.demo.repository.*;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.time.LocalDateTime;
import java.util.*;

@Service
public class ExcelService {

    @Autowired private ProductRepository productRepository;
    @Autowired private ProductVariantRepository productVariantRepository;
    @Autowired private ProductVariantPriceHistoryRepository priceHistoryRepository;
    @Autowired private AttributeRepository attributeRepository;
    @Autowired private AttributeOptionRepository attributeOptionRepository;
    @Autowired private VariantAttributeValueRepository variantAttributeValueRepository;
    @Autowired private CategoryRepository categoryRepository;
    @Autowired private BrandRepository brandRepository;
    @Autowired private UserRepository userRepository;

    public void parseAndInsertExcelData(MultipartFile file, Long categoryId, Long adminId) throws IOException {
        InputStream is = file.getInputStream();
        Workbook workbook = new XSSFWorkbook(is);
        Sheet sheet = workbook.getSheetAt(0);

        Optional<CategoryEntity> categoryOpt = categoryRepository.findById(categoryId);
        if (categoryOpt.isEmpty()) return;
        CategoryEntity category = categoryOpt.get();

        Map<String, ProductEntity> productMap = new HashMap<>();

        Row headerRow = sheet.getRow(0);
        if (headerRow == null) {
            workbook.close();
            throw new RuntimeException("Excel file is missing a header row.");
        }

        Map<String, Integer> colIndex = new HashMap<>();
        Set<String> seenAttributeNames = new HashSet<>();

        for (int i = 0; i < headerRow.getPhysicalNumberOfCells(); i++) {
            String colName = headerRow.getCell(i).getStringCellValue().trim().toLowerCase();
            colIndex.put(colName, i);
            if (!List.of("name", "description", "price", "stock", "brand", "rating", "purchaseprice").contains(colName)) {
                if (!seenAttributeNames.add(colName)) {
                    workbook.close();
                    throw new RuntimeException("❌ Duplicate attribute column: " + colName);
                }
            }
        }

        String lastName = null;
        String lastDescription = null;
        String lastBrandName = null;
        Integer lastRating = null;
        Double lastPrice = null;
        Integer lastStock = null;
        Integer lastPurchasePrice = null;

        for (int i = 1; i < sheet.getPhysicalNumberOfRows(); i++) {
            Row row = sheet.getRow(i);
            if (row == null) continue;

            String productName = getCellString(row.getCell(colIndex.get("name")));
            if (!productName.isEmpty()) lastName = productName;

            String description = getCellString(row.getCell(colIndex.get("description")));
            if (!description.isEmpty()) lastDescription = description;

            String brandName = getCellString(row.getCell(colIndex.get("brand")));
            if (!brandName.isEmpty()) lastBrandName = brandName;

            int ratingVal = getCellInt(row.getCell(colIndex.get("rating")));
            if (ratingVal != 0) lastRating = ratingVal;

            double priceVal = getCellDouble(row.getCell(colIndex.get("price")));
            if (priceVal != 0.0) lastPrice = priceVal;

            int stockVal = getCellInt(row.getCell(colIndex.get("stock")));
            if (stockVal != 0) lastStock = stockVal;

            int purchasePriceVal = getCellInt(row.getCell(colIndex.get("purchaseprice")));
            if (purchasePriceVal != 0) lastPurchasePrice = purchasePriceVal;

            if (lastName == null || lastPrice == null || lastStock == null) continue;

            BrandEntity brandEntity = null;
            if (lastBrandName != null) {
                brandEntity = brandRepository.findByNameIgnoreCase(lastBrandName).orElse(null);
            }

            ProductEntity product = productMap.get(lastName);
            if (product == null) {
                product = new ProductEntity();
                product.setName(lastName);
                product.setDescription(lastDescription);
                product.setBrand(brandEntity);
                product.setRating(lastRating != null ? lastRating : 0);
                product.setCreated_at(LocalDateTime.now());
                product.setCategory(category);
                product.setAdmin_id(adminId);

                product = productRepository.save(product);
                productMap.put(lastName, product);
            }

            String prefix = lastName.replaceAll("\\s+", "").toUpperCase();
            prefix = prefix.length() > 4 ? prefix.substring(0, 4) : prefix;
            Long productId = product.getId();
            int skuCounter = (int) productVariantRepository.countByProductId(productId) + 1;

            ProductVariantEntity variant = new ProductVariantEntity();
            variant.setProduct(product);
            variant.setPrice(lastPrice.intValue());
            variant.setStock(lastStock);
            String sku = String.format("%s%d%03d", prefix, productId, skuCounter);
            variant.setSku(sku);
            productVariantRepository.save(variant);

            PurchaseHistoryEntity purchase = new PurchaseHistoryEntity();
            purchase.setVariant(variant);
            purchase.setQuantity(lastStock);
            purchase.setRemainingQuantity(lastStock);
            purchase.setPurchasePrice(lastPurchasePrice != null ? lastPurchasePrice : 0);
            purchase.setPurchaseDate(LocalDateTime.now());
            variant.getPurchaseHistories().add(purchase);

            ProductVariantPriceHistoryEntity priceHistory = new ProductVariantPriceHistoryEntity();
            priceHistory.setVariant(variant);
            priceHistory.setPrice(lastPrice.intValue());
            priceHistory.setPriceDate(LocalDateTime.now());

            UserEntity admin = userRepository.findById(adminId).orElse(null);
            if (admin != null) {
                priceHistory.setAdmin(admin);
            }
            priceHistoryRepository.save(priceHistory);

            for (Map.Entry<String, Integer> entry : colIndex.entrySet()) {
                String attrName = entry.getKey();
                if (List.of("name", "description", "price", "stock", "brand", "rating", "purchaseprice").contains(attrName)) continue;

                String attrValue = getCellString(row.getCell(entry.getValue()));
                if (attrValue.isEmpty()) continue;

                Optional<AttributeEntity> attributeOpt = attributeRepository.findByNameIgnoreCaseAndCategoryId(attrName, category.getId());
                if (attributeOpt.isEmpty()) continue;

                AttributeEntity attribute = attributeOpt.get();
                attributeOptionRepository.findByAttributeIdAndValueIgnoreCase(attribute.getId(), attrValue)
                        .or(() -> Optional.of(attributeOptionRepository.save(new AttributeOptions(attribute, attrValue))));

                VariantAttributeValueEntity attrVal = new VariantAttributeValueEntity();
                attrVal.setProductVariant(variant);
                attrVal.setAttribute(attribute);
                attrVal.setValue(attrValue);
                variantAttributeValueRepository.save(attrVal);
            }
        }

        workbook.close();
    }

    private String getCellString(Cell cell) {
        if (cell == null) return "";
        try {
            return switch (cell.getCellType()) {
                case STRING -> cell.getStringCellValue().trim();
                case NUMERIC -> String.valueOf(cell.getNumericCellValue());
                case BOOLEAN -> String.valueOf(cell.getBooleanCellValue());
                case FORMULA -> {
                    try {
                        yield cell.getStringCellValue().trim();
                    } catch (IllegalStateException e) {
                        yield String.valueOf(cell.getNumericCellValue());
                    }
                }
                default -> "";
            };
        } catch (Exception e) {
            return "";
        }
    }

    private double getCellDouble(Cell cell) {
        if (cell == null) return 0.0;
        try {
            return switch (cell.getCellType()) {
                case NUMERIC -> cell.getNumericCellValue();
                case STRING -> {
                    String str = cell.getStringCellValue().trim();
                    yield str.isEmpty() ? 0.0 : Double.parseDouble(str);
                }
                case FORMULA -> cell.getNumericCellValue();
                case BOOLEAN -> cell.getBooleanCellValue() ? 1.0 : 0.0;
                default -> 0.0;
            };
        } catch (Exception e) {
            return 0.0;
        }
    }

    private int getCellInt(Cell cell) {
        return (int) getCellDouble(cell);
    }
}
