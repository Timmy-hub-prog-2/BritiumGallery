package com.maven.demo.dto;

public class CustomerGrowthDTO {
    private String period;
    private int count;
    private int cumulativeCount;

    public CustomerGrowthDTO(String period, int count, int cumulativeCount) {
        this.period = period;
        this.count = count;
        this.cumulativeCount = cumulativeCount;
    }

    public String getPeriod() { return period; }
    public void setPeriod(String period) { this.period = period; }
    public int getCount() { return count; }
    public void setCount(int count) { this.count = count; }
    public int getCumulativeCount() { return cumulativeCount; }
    public void setCumulativeCount(int cumulativeCount) { this.cumulativeCount = cumulativeCount; }
} 