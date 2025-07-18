package com.maven.demo.dto;

public class TopCategoryDTO {
    private Long id;
    private String name;
    private String imageUrl;
    private int totalSales;

    public TopCategoryDTO(Long id, String name, String imageUrl, int totalSales) {
        this.id = id;
        this.name = name;
        this.imageUrl = imageUrl;
        this.totalSales = totalSales;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getImageUrl() { return imageUrl; }
    public void setImageUrl(String imageUrl) { this.imageUrl = imageUrl; }
    public int getTotalSales() { return totalSales; }
    public void setTotalSales(int totalSales) { this.totalSales = totalSales; }
} 