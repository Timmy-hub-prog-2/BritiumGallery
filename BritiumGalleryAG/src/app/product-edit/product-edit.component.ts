import {
  Component,
   OnInit,
  ViewChild,
   AfterViewInit,
   ChangeDetectorRef,
   ElementRef,
   TemplateRef,
} from "@angular/core"
import { ActivatedRoute } from '@angular/router';
import {
   FormBuilder,
  FormGroup,
  Validators,
   FormArray,
   AbstractControl,
   FormControl,
} from "@angular/forms"
import { MatPaginator } from "@angular/material/paginator"
import { MatSort } from "@angular/material/sort"
import { MatTableDataSource } from "@angular/material/table"
import  { ProductService } from "../services/product.service"
import  { ProductResponse, VariantResponse } from "../ProductResponse"
import  { MatSnackBar } from "@angular/material/snack-bar"
import  { MatDialog, MatDialogRef } from "@angular/material/dialog"
import { PhotoDialogComponent } from "./photo-dialog.component"
import { animate, state, style, transition, trigger } from "@angular/animations"
import  { HttpErrorResponse } from "@angular/common/http"
import  { BrandService } from "../services/brand.service"
import  { Brand } from "../models/product.model"
import { forkJoin } from "rxjs"

@Component({
  selector: "app-product-edit",
  templateUrl: "./product-edit.component.html",
  standalone: false,
  styleUrls: ["./product-edit.component.css"],
  animations: [
    trigger("detailExpand", [
      state("collapsed,void", style({ height: "0px", minHeight: "0" })),
      state("expanded", style({ height: "*" })),
      transition("expanded <=> collapsed", animate("225ms cubic-bezier(0.4, 0.0, 0.2, 1)")),
    ]),
  ],
})
export class ProductEditComponent implements OnInit, AfterViewInit {
  product: ProductResponse | null = null
  productForm: FormGroup
  variantForm: FormGroup
  stockForm: FormGroup
  isAddingVariant = false
  editingVariant: VariantResponse | null = null
  selectedVariant: VariantResponse | null = null
  previousPurchasePrice = 0
  dataSource: MatTableDataSource<VariantResponse>
  displayedColumns: string[] = ["id", "photos", "price", "stock", "attributes", "actions"]
  isLoading = false
  attributeSuggestions: { [key: string]: string[] } = {}
  selectedFiles: File[] = []
  displayImageUrls: string[] = []
  removedExistingImageUrls: string[] = []
  Object = Object
  isUpdating = false
  private addVariantDialogRef: MatDialogRef<any> | null = null
  brands: Brand[] = []
  selectedBrandId: number | null = null
  basePhotoFile?: File
  basePhotoPreview?: string
  reduceStockForm: FormGroup
  isReducing = false

  @ViewChild("reduceStockModal") reduceStockModal!: TemplateRef<any>
  @ViewChild(MatPaginator) paginator!: MatPaginator
  @ViewChild(MatSort) sort!: MatSort
  @ViewChild("fileInput") fileInput!: ElementRef
  @ViewChild("editProductModal") editProductModal!: TemplateRef<any>
  @ViewChild("addVariantModal") addVariantModal!: TemplateRef<any>
  @ViewChild("editVariantModal") editVariantModal!: TemplateRef<any>
  @ViewChild("addStockModal") addStockModal!: TemplateRef<any>
  @ViewChild("historyModal") historyModal!: TemplateRef<any>
  @ViewChild("priceSort") priceSort!: MatSort
  @ViewChild("purchaseSort") purchaseSort!: MatSort

  priceHistory: any[] = []
  purchaseHistory: any[] = []
  selectedVariantForHistory: VariantResponse | null = null
  priceHistoryDataSource = new MatTableDataSource<any>()
  purchaseHistoryDataSource = new MatTableDataSource<any>()

  constructor(
    private route: ActivatedRoute,
    private productService: ProductService,
    private fb: FormBuilder,
    private snackBar: MatSnackBar,
    private dialog: MatDialog,
    private cdRef: ChangeDetectorRef,
    private brandService: BrandService,
  ) {
    this.productForm = this.fb.group({
      name: ["", [Validators.required, Validators.minLength(3)]],
      description: ["", Validators.maxLength(500)],
      rating: [0, [Validators.required, Validators.min(0), Validators.max(5)]],
      brandId: [null, Validators.required],
    })

    this.variantForm = this.fb.group({
      price: ["", [Validators.required, Validators.min(0.01)]],
      stock: ["", [Validators.required, Validators.min(0)]],
      purchasePrice: ["", [Validators.required, Validators.min(0.01)]],
      attributes: this.fb.array<FormGroup>([]),
      photos: [[]],
    })

    this.stockForm = this.fb.group({
      purchasePrice: ["", [Validators.required, Validators.min(0.01)]],
      sellingPrice: ["", [Validators.required, Validators.min(0.01)]],
      quantity: ["", [Validators.required, Validators.min(1)]],
    })

    this.reduceStockForm = this.fb.group({
      reductions: this.fb.array<FormGroup>([]),
    })

    this.dataSource = new MatTableDataSource<VariantResponse>([])
  }

  get attributesFormArray(): FormArray<FormGroup> {
    return this.variantForm.get("attributes") as FormArray<FormGroup>
  }

  ngOnInit(): void {
    this.route.paramMap.subscribe((params) => {
      const productId = Number(params.get("id"))
      if (productId) {
        forkJoin([this.productService.getProductDetail(productId), this.brandService.getAllBrands()]).subscribe(
          ([product, brands]) => {
            console.log("API product:", product)
            console.log("API brands:", brands)
            if (!product) {
              this.showError("Product not found!")
              this.isLoading = false
              return
            }

            this.brands = brands.map((b) => ({ ...b, id: Number(b.id) }))
            this.product = product
            this.productForm.patchValue({
              name: product.name,
              description: product.description,
              rating: product.rating,
              brandId: product.brandId ? Number(product.brandId) : null,
            })

            this.selectedBrandId = product.brandId ? Number(product.brandId) : null
            this.basePhotoPreview = product.basePhotoUrl || ""
            this.dataSource.data =
              product.variants.map((variant) => ({
                ...variant,
                price: Number(variant.price),
                stock: Number(variant.stock),
              })) || []

            if (this.paginator) {
              this.dataSource.paginator = this.paginator
            }
            if (this.sort) {
              this.dataSource.sort = this.sort
              this.dataSource.sort.sort({
                id: "id",
                start: "asc",
                disableClear: false,
              })
            }

            this.updateAttributeSuggestions()
            this.isLoading = false
          },
        )
      }
    })
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator
    if (this.sort) {
      this.dataSource.sort = this.sort
    }

    this.dataSource.sortingDataAccessor = (item: VariantResponse, property: string) => {
      switch (property) {
        case "id":
          return item.id
        case "price":
          return item.price
        case "stock":
          return item.stock
        case "attributes":
          return Object.entries(item.attributes || {})
            .map(([key, value]) => `${key}:${value}`)
            .join(" ")
        case "photos":
          return item.imageUrls && item.imageUrls.length > 0 ? item.imageUrls[0] : ""
        case "actions":
          return ""
        default:
          return (item as any)[property]
      }
    }

    this.priceHistoryDataSource.sortingDataAccessor = (item, property) => {
      if (property === "date") {
        return item.priceDate ? new Date(item.priceDate).getTime() : 0
      }
      if (property === "price") {
        return item.price || 0
      }
      return item[property]
    }

    this.purchaseHistoryDataSource.sortingDataAccessor = (item, property) => {
      if (property === "date") {
        return item.purchaseDate ? new Date(item.purchaseDate).getTime() : 0
      }
      if (property === "purchasePrice") {
        return item.purchasePrice || 0
      }
      return item[property]
    }

    this.updateAttributeSuggestions()
    this.isLoading = false
  }

  loadProduct(id: number): void {
    this.isLoading = true
    this.productService.getProductDetail(id).subscribe({
      next: (product: ProductResponse) => {
        this.product = product
        this.productForm.patchValue({
          name: product.name,
          description: product.description,
          rating: product.rating,
          brandId: product.brandId || null,
        })
        this.selectedBrandId = product.brandId || null
        this.basePhotoPreview = product.basePhotoUrl || ""
        this.dataSource.data =
          product.variants.map((variant) => ({
            ...variant,
            price: Number(variant.price),
            stock: Number(variant.stock),
          })) || []

        if (this.paginator) {
          this.dataSource.paginator = this.paginator
        }
        if (this.sort) {
          this.dataSource.sort = this.sort
          this.dataSource.sort.sort({
            id: "id",
            start: "asc",
            disableClear: false,
          })
        }

        this.updateAttributeSuggestions()
        this.isLoading = false
      },
      error: (error: Error) => {
        console.error("Error loading product:", error)
        this.showError("Failed to load product.")
        this.isLoading = false
      },
    })
  }

  editProductInfo(): void {
    if (this.product) {
      this.selectedBrandId = this.product.brandId || null
      this.basePhotoPreview = this.product.basePhotoUrl || ""
      this.productForm.patchValue({ brandId: this.selectedBrandId })
    }

    const dialogRef = this.dialog.open(this.editProductModal, {
      width: "600px",
      data: { title: "Edit Product Information" },
    })

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.saveProduct()
      }
    })
  }

  private getUniqueAttributeNames(): string[] {
    const uniqueAttributes = new Set<string>()
    this.dataSource.data.forEach((variant) => {
      Object.keys(variant.attributes).forEach((key) => {
        uniqueAttributes.add(key)
      })
    })
    return Array.from(uniqueAttributes)
  }

  addNewVariant(): void {
    this.variantForm.reset()
    this.attributesFormArray.clear()
    this.selectedFiles = []
    this.displayImageUrls = []
    this.removedExistingImageUrls = []

    const uniqueAttributes = this.getUniqueAttributeNames()
    uniqueAttributes.forEach((attrName) => {
      this.attributesFormArray.push(
        this.fb.group({
          key: [attrName, Validators.required],
          value: ["", Validators.required],
        }),
      )
    })

    this.addVariantDialogRef = this.dialog.open(this.addVariantModal, {
      width: "800px",
      disableClose: true,
    })

    this.addVariantDialogRef.afterClosed().subscribe(() => {
      this.addVariantDialogRef = null
      this.isAddingVariant = false
      this.variantForm.reset()
      this.attributesFormArray.clear()
      this.selectedFiles = []
      this.displayImageUrls = []
      this.removedExistingImageUrls = []
    })
  }

  editVariant(variant: VariantResponse): void {
    this.editingVariant = { ...variant }
    this.selectedFiles = []
    this.removedExistingImageUrls = []
    this.displayImageUrls = [...(variant.imageUrls || [])]

    this.variantForm.reset()
    this.variantForm.patchValue({
      price: this.editingVariant.price,
      stock: this.editingVariant.stock, // Ensure stock is patched too
    })

    const newAttributesFormArray = this.fb.array<FormGroup>([])
    if (this.editingVariant.attributes) {
      Object.entries(this.editingVariant.attributes).forEach(([key, value]) => {
        newAttributesFormArray.push(
          this.fb.group({
            key: [key, Validators.required],
            value: [value, Validators.required],
          }),
        )
      })
    }
    this.variantForm.setControl("attributes", newAttributesFormArray)
    this.cdRef.detectChanges()

    const dialogRef = this.dialog.open(this.editVariantModal, {
      width: "800px",
      data: { title: "Edit Variant" },
      disableClose: true,
    })

    dialogRef.afterClosed().subscribe((result) => {
      if (result === true) {
        this.updateVariant()
      } else {
        this.editingVariant = null
        this.variantForm.reset()
        this.attributesFormArray.clear()
        this.selectedFiles = []
        this.displayImageUrls = []
        this.removedExistingImageUrls = []
      }
    })
  }

  saveProduct(): void {
    if (this.productForm.valid && this.product) {
      this.isLoading = true
      const formData = new FormData()
      const productPayload = {
        name: this.productForm.value.name,
        description: this.productForm.value.description,
        categoryId: this.product.categoryId,
        adminId: this.product.adminId,
        basePhotoUrl: this.product.basePhotoUrl,
        rating: this.productForm.value.rating,
        brandId: this.productForm.value.brandId,
      }

      formData.append("product", new Blob([JSON.stringify(productPayload)], { type: "application/json" }))

      if (this.basePhotoFile) {
        formData.append("basePhoto", this.basePhotoFile)
      }

      this.productService.updateProduct(this.product.id, formData).subscribe({
        next: (response: ProductResponse) => {
          this.product = response
          this.showSuccess("Product updated successfully")
          this.isLoading = false
        },
        error: (error: Error) => {
          console.error("Error updating product:", error)
          this.showError("Failed to update product")
          this.isLoading = false
        },
      })
    }
  }

  saveVariant(): void {
    if (this.variantForm.invalid) {
      this.markFormGroupTouched(this.variantForm)
      this.showError("Please fill in all required fields and correct errors.")
      return
    }

    const variantData = this.variantForm.value
    const attributes: { [key: string]: string } = {}

    this.attributesFormArray.controls.forEach((control) => {
      const key = control.get("key")?.value
      const value = control.get("value")?.value
      if (key && value) {
        attributes[key] = value
      }
    })

    variantData.attributes = attributes
    // Ensure purchasePrice is included in the payload
    // (already present if using variantForm.value)

    const formData = new FormData()
    formData.append("variant", new Blob([JSON.stringify(variantData)], { type: "application/json" }))

    this.selectedFiles.forEach((file) => {
      formData.append("photos", file, file.name)
    })

    if (this.removedExistingImageUrls.length > 0) {
      formData.append("removedImageUrls", JSON.stringify(this.removedExistingImageUrls))
    }

    // Add adminId from logged-in user
    const loggedInUser = JSON.parse(localStorage.getItem("loggedInUser") || "{}")
    if (loggedInUser && loggedInUser.id) {
      formData.append("adminId", loggedInUser.id.toString())
    }

    this.isUpdating = true
    if (this.product) {
      this.productService.addVariantWithPhotos(this.product.id, formData).subscribe({
        next: () => {
          this.showSuccess("Variant added successfully")
          this.loadProduct(this.product!.id)
          this.isUpdating = false

          if (this.addVariantDialogRef) {
            this.addVariantDialogRef.close(true)
          }
        },
        error: (error: HttpErrorResponse) => {
          console.error("Error adding variant:", error)
          let errorMessage = "Failed to add variant. Please try again."
          if (error.status === 400 && error.error && typeof error.error === "string") {
            errorMessage = error.error
          } else if (error.error && error.error.message) {
            errorMessage = error.error.message
          } else if (error.status === 405) {
            errorMessage = "Server does not support POST method for this endpoint. Please check backend configuration."
          }
          this.showError(errorMessage)
          this.isUpdating = false
        },
      })
    }
  }

  updateVariant(): void {
    if (this.editingVariant && this.product && this.variantForm.valid && !this.isUpdating) {
      this.isUpdating = true

      this.editingVariant.price = this.variantForm.value.price

      const updatedAttributes: { [key: string]: string } = {}
      this.attributesFormArray.controls.forEach((control) => {
        const key = control.get("key")?.value
        const value = control.get("value")?.value
        if (key && value) {
          updatedAttributes[key] = value
        }
      })
      this.editingVariant.attributes = updatedAttributes

      const formData = new FormData()

      const variantData = {
        id: this.editingVariant.id,
        price: this.editingVariant.price,
        attributes: this.editingVariant.attributes,
        imageUrls: this.editingVariant.imageUrls.filter((url) => !this.removedExistingImageUrls.includes(url)),
        imageUrlsToDelete: this.removedExistingImageUrls,
      }

      formData.append("variant", new Blob([JSON.stringify(variantData)], { type: "application/json" }))

      const loggedInUser = JSON.parse(localStorage.getItem("loggedInUser") || "{}")
      if (loggedInUser && loggedInUser.id) {
        formData.append("adminId", loggedInUser.id.toString())
      }

      this.selectedFiles.forEach((file) => {
        formData.append("photos", file)
      })

      this.productService.updateVariantWithPhotos(this.editingVariant.id, formData).subscribe({
        next: (response: VariantResponse) => {
          this.showSuccess("Variant updated successfully")
          this.loadProduct(this.product!.id)
          this.editingVariant = null
          this.variantForm.reset()
          this.attributesFormArray.clear()
          this.selectedFiles = []
          this.displayImageUrls = []
          this.removedExistingImageUrls = []
          this.isUpdating = false
        },
        error: (error: Error) => {
          console.error("Error updating variant:", error)
          this.showError("Failed to update variant")
          this.isUpdating = false
        },
      })
    } else if (this.editingVariant) {
      this.markFormGroupTouched(this.variantForm)
      this.showError("Please fill in all required variant fields.")
    }
  }

  deleteVariant(variant: VariantResponse): void {
    if (confirm("Are you sure you want to delete this variant?")) {
      if (this.product) {
        this.productService.deleteVariant(variant.id).subscribe({
          next: () => {
            this.showSuccess("Variant deleted successfully")
            this.loadProduct(this.product!.id)
          },
          error: (error: Error) => {
            console.error("Error deleting variant:", error)
            this.showError("Failed to delete variant")
          },
        })
      }
    }
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement
    if (input.files) {
      const newFiles = Array.from(input.files)
      this.selectedFiles = [...this.selectedFiles, ...newFiles]

      newFiles.forEach((file) => {
        const reader = new FileReader()
        reader.onload = (e: any) => {
          this.displayImageUrls.push(e.target.result)
          this.cdRef.detectChanges()
        }
        reader.readAsDataURL(file)
      })
    }
  }

  removePhoto(index: number): void {
    if (index >= 0 && index < this.displayImageUrls.length) {
      const removedUrl = this.displayImageUrls[index]

      if (this.editingVariant?.imageUrls?.includes(removedUrl)) {
        this.removedExistingImageUrls.push(removedUrl)
      }

      const fileIndex = this.selectedFiles.findIndex((file) => URL.createObjectURL(file) === removedUrl)
      if (fileIndex > -1) {
        URL.revokeObjectURL(this.selectedFiles[fileIndex] as any)
        this.selectedFiles.splice(fileIndex, 1)
      }

      this.displayImageUrls.splice(index, 1)
      this.cdRef.detectChanges()
    }
  }

  addAttribute(): void {
    const attributes = this.variantForm.get("attributes") as FormArray<FormGroup>
    if (attributes) {
      attributes.push(
        this.fb.group({
          key: ["", Validators.required],
          value: ["", Validators.required],
        }),
      )
    }
  }

  removeAttribute(index: number): void {
    this.attributesFormArray.removeAt(index)
  }

  removeEditingAttribute(key: string): void {
    if (this.editingVariant) {
      delete this.editingVariant.attributes[key]
      this.editingVariant = { ...this.editingVariant }
    }
  }

  onAttributeKeyChange(index: number): void {
    const key = this.attributesFormArray.at(index).get("key")?.value
    if (key && this.attributeSuggestions[key]) {
      this.updateAttributeSuggestions()
    }
  }

  updateAttributeSuggestions(): void {
    if (this.product) {
      this.product.variants.forEach((variant: VariantResponse) => {
        Object.entries(variant.attributes).forEach(([key, value]) => {
          if (!this.attributeSuggestions[key as string]) {
            this.attributeSuggestions[key as string] = []
          }
          if (!this.attributeSuggestions[key as string].includes(value as string)) {
            this.attributeSuggestions[key as string].push(value as string)
          }
        })
      })
    }
  }

  applyFilter(event: Event): void {
    const filterValue = (event.target as HTMLInputElement).value
    this.dataSource.filter = filterValue.trim().toLowerCase()
  }

  getTotalStock(): number {
    return this.dataSource.data.reduce((total, variant) => total + variant.stock, 0)
  }

  getAveragePrice(): number {
    if (this.dataSource.data.length === 0) return 0
    const total = this.dataSource.data.reduce((sum, variant) => sum + variant.price, 0)
    return total / this.dataSource.data.length
  }

  trackByVariant(index: number, variant: VariantResponse): number {
    return variant.id
  }

  getStockClass(stock: number): string {
    if (stock <= 0) return "out-of-stock"
    if (stock < 10) return "low-stock"
    return "in-stock"
  }

  cancelAddVariant(): void {
    if (this.addVariantDialogRef) {
      this.addVariantDialogRef.close(false)
    }
  }

  cancelEdit(): void {
    this.editingVariant = null
    this.variantForm.reset()
    this.attributesFormArray.clear()
    this.selectedFiles = []
    this.displayImageUrls = []
    this.removedExistingImageUrls = []
  }

  private showSuccess(message: string): void {
    this.snackBar.open(message, "Close", {
      duration: 3000,
      panelClass: ["success-snackbar"],
    })
  }

  private showError(message: string): void {
    this.snackBar.open(message, "Close", {
      duration: 3000,
      panelClass: ["error-snackbar"],
    })
  }

  hasValidImageUrls(imageUrls: string[]): boolean {
    return !!(imageUrls && imageUrls.length > 0 && imageUrls.some((url) => url && url.trim() !== ""))
  }

  isExpanded = (i: number, variant: VariantResponse) => {
    return this.editingVariant?.id === variant.id
  }

  openPhotoDialog(url: string): void {
    this.dialog.open(PhotoDialogComponent, {
      data: { url },
      maxWidth: "90vw",
      maxHeight: "90vh",
    })
  }

  trackByAttribute(index: number, item: any): number {
    return index
  }

  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.values(formGroup.controls).forEach((control) => {
      control.markAsTouched()
      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control)
      }
    })
  }

  addStock(variant: VariantResponse): void {
    this.selectedVariant = variant

    this.productService.getLatestPurchasePrice(variant.id).subscribe({
      next: (price: number) => {
        this.previousPurchasePrice = price

        this.stockForm.patchValue({
          purchasePrice: price,
          sellingPrice: variant.price,
          quantity: 0,
        })

        const dialogRef = this.dialog.open(this.addStockModal, {
          width: "500px",
          disableClose: true,
        })

        dialogRef.afterClosed().subscribe((result) => {
          if (result === true) {
            this.saveStock()
          }
          this.selectedVariant = null
          this.previousPurchasePrice = 0
          this.stockForm.reset()
        })
      },
      error: (error: Error) => {
        console.error("Error fetching previous purchase price:", error)
        this.showError("Failed to fetch previous purchase price")
      },
    })
  }

  saveStock(): void {
    if (this.stockForm.valid && this.selectedVariant) {
      this.isUpdating = true

      const stockData = {
        variantId: this.selectedVariant.id,
        purchasePrice: this.stockForm.value.purchasePrice,
        sellingPrice: this.stockForm.value.sellingPrice,
        quantity: this.stockForm.value.quantity,
      }

      const loggedInUser = JSON.parse(localStorage.getItem("loggedInUser") || "{}")
      const adminId = loggedInUser && loggedInUser.id ? loggedInUser.id : null

      this.productService.addStock(stockData, adminId).subscribe({
        next: (response: VariantResponse) => {
          this.showSuccess("Stock added successfully")
          this.loadProduct(this.product!.id)
          this.isUpdating = false
          this.dialog.closeAll()
        },
        error: (error: Error) => {
          console.error("Error adding stock:", error)
          this.showError("Failed to add stock")
          this.isUpdating = false
        },
      })
    }
  }

  showHistory(variant: VariantResponse): void {
    this.selectedVariantForHistory = variant
    this.loadHistoryData(variant.id)

    const dialogRef = this.dialog.open(this.historyModal, {
      width: "92vw",
      maxWidth: "1500px",
      maxHeight: "100vh",
      disableClose: true,
      panelClass: "history-modal",
    })

    dialogRef.afterOpened().subscribe(() => {
      if (this.priceSort) this.priceHistoryDataSource.sort = this.priceSort
      if (this.purchaseSort) this.purchaseHistoryDataSource.sort = this.purchaseSort
    })

    dialogRef.afterClosed().subscribe(() => {
      this.selectedVariantForHistory = null
      this.priceHistory = []
      this.purchaseHistory = []
      this.priceHistoryDataSource.data = []
      this.purchaseHistoryDataSource.data = []
    })
  }

  closeHistoryModal(): void {
    this.dialog.closeAll()
  }

  private loadHistoryData(variantId: number): void {
    this.productService.getPriceHistory(variantId).subscribe({
      next: (data: any[]) => {
        data.forEach((row) => (row.priceDate = new Date(row.priceDate)))
        this.priceHistory = data
        this.priceHistoryDataSource.data = data
      },
      error: (error: Error) => {
        console.error("Error loading price history:", error)
        this.showError("Failed to load price history")
      },
    })

    this.productService.getPurchaseHistory(variantId).subscribe({
      next: (data: any[]) => {
        data.forEach((row) => (row.purchaseDate = new Date(row.purchaseDate)))
        this.purchaseHistory = data
        this.purchaseHistoryDataSource.data = data
      },
      error: (error: Error) => {
        console.error("Error loading purchase history:", error)
        this.showError("Failed to load purchase history")
      },
    })
  }

  onBasePhotoSelected(event: Event): void {
    const input = event.target as HTMLInputElement
    if (input.files && input.files.length > 0) {
      this.basePhotoFile = input.files[0]
      const reader = new FileReader()
      reader.onload = (e: any) => {
        this.basePhotoPreview = e.target.result
        this.cdRef.detectChanges()
      }
      reader.readAsDataURL(this.basePhotoFile)
    }
  }

  triggerProductImageUpload(): void {
    const input = document.getElementById("basePhoto") as HTMLInputElement
    if (input) {
      input.click()
    }
  }

  removeProductImage(): void {
    this.basePhotoPreview = ""
    this.basePhotoFile = undefined
    const input = document.getElementById("basePhoto") as HTMLInputElement
    if (input) {
      input.value = ""
    }
  }

  openReduceStockModal(variant: VariantResponse): void {
    this.selectedVariant = variant
    this.isReducing = false

    this.productService.getPurchaseHistory(variant.id).subscribe({
      next: (data: any[]) => {
        data.forEach((row) => (row.purchaseDate = new Date(row.purchaseDate)))
        // Only show batches with remainingQuantity > 0
        this.purchaseHistory = data.filter((row) => row.remainingQuantity > 0)

        const reductionsFGs = this.purchaseHistory.map((ph) =>
          this.fb.group({
            purchaseId: [ph.id],
            quantity: [0, [Validators.min(0), Validators.max(ph.remainingQuantity)]],
          }),
        )

        this.reduceStockForm = this.fb.group({
          reductions: this.fb.array(reductionsFGs),
        })

        const dialogRef = this.dialog.open(this.reduceStockModal, {
          width: "100vw",
          maxWidth: "100vw",
          disableClose: true,
          panelClass: "reduce-stock-modal",
        })

        dialogRef.afterClosed().subscribe((result) => {
          this.selectedVariant = null
          this.reduceStockForm.reset()
        })
      },
      error: (error: Error) => {
        this.showError("Failed to load purchase history")
      },
    })
  }

  get reductionsFormArray(): FormArray {
    return this.reduceStockForm.get("reductions") as FormArray
  }

  getTotalReduction(): number {
    return this.reductionsFormArray?.controls.reduce((sum, group) => sum + (group.get("quantity")?.value || 0), 0)
  }

  incrementReduction(i: number, max: number): void {
    const ctrl = this.reductionsFormArray.at(i).get("quantity")
    if (ctrl && ctrl.value < max) {
      ctrl.setValue(ctrl.value + 1)
    }
  }

  decrementReduction(i: number): void {
    const ctrl = this.reductionsFormArray.at(i).get("quantity")
    if (ctrl && ctrl.value > 0) {
      ctrl.setValue(ctrl.value - 1)
    }
  }

  submitReduceStock(): void {
    if (this.reduceStockForm.valid && this.selectedVariant) {
      this.isReducing = true
      const reductions = this.reductionsFormArray.controls
        .map((group) => ({
          purchaseId: group.get("purchaseId")?.value,
          quantity: group.get("quantity")?.value,
        }))
        .filter((r) => r.quantity > 0)

      this.productService.reduceStock(this.selectedVariant.id, { reductions }).subscribe({
        next: () => {
          this.showSuccess("Stock reduced successfully")
          if (this.product) {
            this.loadProduct(this.product.id)
          }
          this.isReducing = false
          this.dialog.closeAll()
        },
        error: (error: Error) => {
          this.showError("Failed to reduce stock")
          this.isReducing = false
        },
      })
    }
  }

  getQuantityControl(group: AbstractControl): FormControl {
    return group.get("quantity") as FormControl
  }
}
