package com.maven.demo.entity;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

@Entity
@Table(name = "sale_fifo_mapping")
public class SaleFifoMappingEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Integer quantity;
    private Integer unitCost;

    @ManyToOne
    @JoinColumn(name = "order_detail_id")
    private OrderDetailEntity orderDetail;

    @ManyToOne
    @JoinColumn(name = "purchase_history_id")
    private PurchaseHistoryEntity purchaseHistory;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Integer getQuantity() { return quantity; }
    public void setQuantity(Integer quantity) { this.quantity = quantity; }
    public Integer getUnitCost() { return unitCost; }
    public void setUnitCost(Integer unitCost) { this.unitCost = unitCost; }
    public OrderDetailEntity getOrderDetail() { return orderDetail; }
    public void setOrderDetail(OrderDetailEntity orderDetail) { this.orderDetail = orderDetail; }
    public PurchaseHistoryEntity getPurchaseHistory() { return purchaseHistory; }
    public void setPurchaseHistory(PurchaseHistoryEntity purchaseHistory) { this.purchaseHistory = purchaseHistory; }
}

