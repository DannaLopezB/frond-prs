import { Component, Input, Output, EventEmitter, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { Sale } from '../../../../../../interfaces/Sale';
import { SaleDetail } from '../../../../../../interfaces/Sale';
import { SaleService } from '../../../../../../service/sale.service';
import { ProductService } from '../../../../../../service/product.service';
import { Product } from '../../../../../../interfaces/Product';
import { forkJoin, Observable, debounceTime, distinctUntilChanged } from 'rxjs';

// Interfaz para manejar la cantidad de productos seleccionados
interface ProductQuantity {
  productId: number;
  quantity: number;
  product: Product;
}

/**
 * Componente Modal para Crear, Editar y Visualizar Ventas
 * 
 * Este componente maneja un modal que permite:
 * - Crear nuevas ventas
 * - Editar ventas existentes
 * - Visualizar detalles de ventas
 * - Gestionar inventario de productos automáticamente
 */
@Component({
  selector: 'app-model-sale',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './model-sale.component.html',
  styleUrls: ['./model-sale.component.css']
})
export class ModelSaleComponent implements OnChanges {
  // ========================
  // PROPIEDADES DE ENTRADA Y SALIDA
  // ========================
  
  @Input() isOpen: boolean = false;                    // Controla si el modal está abierto
  @Input() mode: 'create' | 'edit' | 'view' = 'create'; // Modo de operación del modal
  @Input() saleData: Sale | null = null;              // Datos de la venta para editar/ver

  @Output() closeModal = new EventEmitter<void>();      // Evento para cerrar el modal
  @Output() saleCreated = new EventEmitter<Sale>();     // Evento cuando se crea una venta
  @Output() saleUpdated = new EventEmitter<Sale>();     // Evento cuando se actualiza una venta

  // ========================
  // PROPIEDADES DEL COMPONENTE
  // ========================
  
  saleForm: FormGroup;                                 // Formulario reactivo para la venta
  products: Product[] = [];                            // Lista completa de productos
  availableProductsForType: Product[] = [];            // Productos disponibles para el tipo seleccionado
  selectedProducts: Product[] = [];                    // Productos seleccionados (para compatibilidad)
  selectedProductQuantities: Map<number, number> = new Map(); // Mapa de cantidades por producto ID

  // Estados del componente
  isLoading: boolean = false;                          // Indicador de carga
  errorMessage: string = '';                           // Mensajes de error
  originalSaleData: Sale | null = null;                // Datos originales para comparar cambios
  isSearchingDocument: boolean = false;                // Indicador de búsqueda por documento

  constructor(
    private fb: FormBuilder,
    private saleService: SaleService,
    private productService: ProductService
  ) {
    this.saleForm = this.createForm();
    this.loadProducts();
    this.setupDocumentSearchListener();
  }

  /**
   * Ciclo de vida: Se ejecuta cuando cambian las propiedades de entrada
   * Configura el formulario según el modo de operación
   */
  ngOnChanges(): void {
    if (this.isOpen) {
      this.errorMessage = '';
      
      // Solo limpiar productos en modo create para evitar perder datos
      if (this.mode === 'create') {
        this.selectedProducts = [];
        this.selectedProductQuantities.clear();
        this.availableProductsForType = [];
      }

      // Configurar formulario según el modo
      if (this.mode === 'view') {
        this.saleForm.disable(); // Deshabilitar en modo visualización
      } else {
        this.saleForm.enable();
        this.saleForm.get('totalPrice')?.disable(); // Precio total siempre calculado
      }

      // Cargar productos (filtrar solo PT activos excepto en modo view)
      this.loadProducts(this.mode !== 'view');

      // Configurar datos para edición o visualización
      if ((this.mode === 'edit' || this.mode === 'view') && this.saleData) {
        this.originalSaleData = { ...this.saleData };

        // Obtener datos de los detalles de venta
        const pricePerKg = this.saleData.details?.[0]?.pricePerKg ?? 0;
        const totalPrice = this.getTotalPriceFromDetails(this.saleData.details ?? []);

        // Rellenar formulario con datos existentes
        this.saleForm.patchValue({
          id: this.saleData.id,
          saleDate: this.formatDateForInput(this.saleData.saleDate),
          name: this.saleData.name,
          ruc: this.saleData.ruc,
          address: this.saleData.address,
          pricePerKg: pricePerKg,
          totalPrice: totalPrice.toFixed(2)
        });

        // Cargar productos disponibles para el tipo de la venta
        this.loadSelectedProductsForEdit();
        
        // Cargar las cantidades existentes de productos
        this.loadExistingQuantities(this.saleData.details ?? []);
        
      } else if (this.mode === 'create') {
        // Reiniciar formulario para nueva venta
        this.saleForm = this.createForm();
        this.saleForm.get('id')?.setValue(null);
        this.originalSaleData = null;
        this.setupDocumentSearchListener();
      }

      // Calcular totales si no es modo crear
      if (this.mode !== 'create') {
        this.calculateTotals();
      }
    }
  }

  // ========================
  // MÉTODOS PARA MANEJAR CANTIDADES DE PRODUCTOS
  // ========================

  /**
   * Obtiene la cantidad seleccionada de un producto específico
   * @param productId ID del producto
   * @returns Cantidad seleccionada o 0 si no está seleccionado
   */
  getProductQuantity(productId: number): number {
    return this.selectedProductQuantities.get(productId) || 0;
  }

  /**
   * Obtiene el stock disponible de un producto específico
   * @param productId ID del producto
   * @returns Stock disponible o 0 si no se encuentra
   */
  getProductStock(productId: number): number {
    const product = this.allProductsInStock.find(p => p.id === productId);
    return product ? product.stock : 0;
  }

  /**
   * Incrementa la cantidad de un producto seleccionado
   * Verifica que no exceda el stock disponible
   * @param productId ID del producto
   */
  increaseProductQuantity(productId: number): void {
    const currentQuantity = this.getProductQuantity(productId);
    const maxStock = this.getProductStock(productId);
    
    if (currentQuantity < maxStock) {
      this.selectedProductQuantities.set(productId, currentQuantity + 1);
      this.updateSelectedProducts();
      this.calculateTotals();
    }
  }

  /**
   * Decrementa la cantidad de un producto seleccionado
   * Elimina del mapa si la cantidad llega a 0
   * @param productId ID del producto
   */
  decreaseProductQuantity(productId: number): void {
    const currentQuantity = this.getProductQuantity(productId);
    
    if (currentQuantity > 0) {
      const newQuantity = currentQuantity - 1;
      if (newQuantity === 0) {
        this.selectedProductQuantities.delete(productId);
      } else {
        this.selectedProductQuantities.set(productId, newQuantity);
      }
      this.updateSelectedProducts();
      this.calculateTotals();
    }
  }

  /**
   * Establece una cantidad específica para un producto
   * Valida que esté dentro del rango permitido (0 a stock máximo)
   * @param productId ID del producto
   * @param quantity Cantidad a establecer
   */
  setProductQuantity(productId: number, quantity: number): void {
    const maxStock = this.getProductStock(productId);
    const validQuantity = Math.min(Math.max(0, quantity), maxStock);
    
    if (validQuantity === 0) {
      this.selectedProductQuantities.delete(productId);
    } else {
      this.selectedProductQuantities.set(productId, validQuantity);
    }
    
    this.updateSelectedProducts();
    this.calculateTotals();
  }

  /**
   * Actualiza la lista de productos seleccionados basada en las cantidades
   * Mantiene compatibilidad con el código existente que usa selectedProducts[]
   */
  updateSelectedProducts(): void {
    this.selectedProducts = [];
    
    this.selectedProductQuantities.forEach((quantity, productId) => {
      const product = this.allProductsInStock.find(p => p.id === productId);
      if (product && quantity > 0) {
        // Agregar cada paquete individual como entrada separada
        for (let i = 0; i < quantity; i++) {
          this.selectedProducts.push(product);
        }
      }
    });
  }

  /**
   * Obtiene el peso total de un producto específico seleccionado
   * @param productId ID del producto
   * @returns Peso total (cantidad * peso por paquete)
   */
  getProductTotalWeight(productId: number): number {
    const quantity = this.getProductQuantity(productId);
    const product = this.allProductsInStock.find(p => p.id === productId);
    return product ? (quantity * product.packageWeight) : 0;
  }

  /**
   * Obtiene el precio total de un producto específico seleccionado
   * @param productId ID del producto
   * @returns Precio total formateado como string
   */
  getProductTotalPrice(productId: number): string {
    const totalWeight = this.getProductTotalWeight(productId);
    const pricePerKg = this.saleForm.get('pricePerKg')?.value || 0;
    const totalPrice = totalWeight * pricePerKg;
    return totalPrice.toFixed(2);
  }

  /**
   * Obtiene el total de productos seleccionados (suma de cantidades)
   * @returns Número total de productos seleccionados
   */
  getTotalSelectedProducts(): number {
    let total = 0;
    this.selectedProductQuantities.forEach(quantity => {
      total += quantity;
    });
    return total;
  }

  /**
   * Inicializa las cantidades al cargar datos existentes (para modo edición)
   * @param saleDetails Detalles de venta existentes
   */
  loadExistingQuantities(saleDetails: SaleDetail[]): void {
    this.selectedProductQuantities.clear();
    
    // Contar cantidades por producto ID
    const productCounts = new Map<number, number>();
    
    saleDetails.forEach(detail => {
      const currentCount = productCounts.get(detail.productId) || 0;
      productCounts.set(detail.productId, currentCount + detail.packages);
    });
    
    // Establecer las cantidades en el mapa
    productCounts.forEach((quantity, productId) => {
      this.selectedProductQuantities.set(productId, quantity);
    });
    
    this.updateSelectedProducts();
  }

  /**
   * Convierte las cantidades seleccionadas a formato SaleDetail[] para guardar
   * @returns Array de detalles de venta
   */
  convertToSaleDetails(): SaleDetail[] {
    const saleDetails: SaleDetail[] = [];
    const pricePerKg = this.saleForm.get('pricePerKg')?.value || 0;
    
    this.selectedProductQuantities.forEach((quantity, productId) => {
      const product = this.allProductsInStock.find(p => p.id === productId);
      if (product && quantity > 0) {
        const totalWeight = quantity * product.packageWeight;
        const totalPrice = totalWeight * pricePerKg;
        
        saleDetails.push({
          productId: productId,
          weight: product.packageWeight,
          packages: quantity,
          totalWeight: totalWeight,
          pricePerKg: pricePerKg,
          totalPrice: totalPrice
        });
      }
    });
    
    return saleDetails;
  }

  // ========================
  // MÉTODOS PARA VALIDACIÓN Y FORMULARIO
  // ========================

  /**
   * Calcula el precio total de los detalles de venta
   * @param details Detalles de venta
   * @returns Precio total
   */
  private getTotalPriceFromDetails(details: SaleDetail[]): number {
    return details.reduce((sum, d) => sum + (d.totalWeight * d.pricePerKg), 0);
  }

  /**
   * Validador personalizado para nombres
   * Solo permite letras, espacios y caracteres especiales del español
   * @param control Control del formulario
   * @returns Error de validación o null si es válido
   */
  private nameValidator(control: AbstractControl): ValidationErrors | null {
    if (!control.value) return null;
    
    const nameRegex = /^[a-zA-ZñÑáéíóúÁÉÍÓÚüÜ\s]+$/;
    if (!nameRegex.test(control.value)) {
      return { invalidName: true };
    }
    return null;
  }

  /**
   * Validador personalizado para documentos (DNI/RUC)
   * DNI: 8 dígitos, RUC: 11 dígitos
   * @param control Control del formulario
   * @returns Error de validación o null si es válido
   */
  private documentValidator = (control: AbstractControl): ValidationErrors | null => {
    if (!control.value) return null;
    
    const value = control.value.toString();
    const isDni = /^\d{8}$/.test(value);
    const isRuc = /^\d{11}$/.test(value);
    
    if (!isDni && !isRuc) {
      return { invalidDocument: true };
    }
    return null;
  }

  /**
   * Crea el formulario reactivo con validaciones
   * @returns FormGroup configurado
   */
  createForm(): FormGroup {
    return this.fb.group({
      id: [null],
      saleDate: [this.getCurrentDate(), Validators.required],
      name: ['', [Validators.required, this.nameValidator]],
      ruc: ['', [Validators.required, this.documentValidator]],
      address: ['', Validators.required],
      pricePerKg: [{ value: 0, disabled: false }, [Validators.required, Validators.min(0.01)]],
      totalPrice: [{ value: 0, disabled: true }] // Siempre calculado automáticamente
    });
  }

  /**
   * Configura el listener para búsqueda automática por documento
   * Busca ventas existentes cuando se ingresa un documento válido
   */
  private setupDocumentSearchListener(): void {
    const rucControl = this.saleForm.get('ruc');
    if (rucControl) {
      rucControl.valueChanges.pipe(
        debounceTime(500),        // Espera 500ms después del último cambio
        distinctUntilChanged()    // Solo emite si el valor cambió
      ).subscribe(value => {
        if (value && this.isValidDocument(value)) {
          this.searchByDocument(value);
        }
      });
    }
  }

  /**
   * Valida si un documento tiene formato correcto
   * @param document Documento a validar
   * @returns true si es válido
   */
  private isValidDocument(document: string): boolean {
    const isDni = /^\d{8}$/.test(document);
    const isRuc = /^\d{11}$/.test(document);
    return isDni || isRuc;
  }

  /**
   * Busca información del cliente por documento
   * Auto-completa nombre y dirección si encuentra una venta previa
   * @param document Documento a buscar
   */
  private searchByDocument(document: string): void {
    this.isSearchingDocument = true;

    this.saleService.getSalesByRuc(document).subscribe({
      next: (sales: Sale[]) => {
        const existingSale = sales[0];
        if (existingSale) {
          // Auto-completar datos del cliente
          this.saleForm.patchValue({
            name: existingSale.name,
            address: existingSale.address
          });
        }
        this.isSearchingDocument = false;
      },
      error: (error: any) => {
        console.log('No se encontró venta con ese documento, se puede crear nueva');
        this.isSearchingDocument = false;
      }
    });
  }

  // ========================
  // MÉTODOS PARA MANEJO DE PRODUCTOS
  // ========================

  /**
   * Carga la lista de productos desde el servicio
   * @param filterPTOnly Si true, solo carga productos PT activos con stock
   */
  loadProducts(filterPTOnly: boolean = false): void {
    this.productService.getAll().subscribe({
      next: (products) => {
        if (filterPTOnly) {
          // Filtrar solo productos terminados activos con stock
          this.products = products.filter(
            product =>
              product.typeProduct === 'PT' &&
              product.status === 'A' &&
              product.stock > 0
          );
        } else {
          this.products = products;
        }
      },
      error: (error: any) => {
        console.error('Error al cargar productos:', error);
        this.errorMessage = 'No se pudieron cargar los productos. Por favor, intente nuevamente.';
      }
    });
  }

  /**
   * Getter para obtener productos en stock disponibles
   * @returns Productos PT activos con stock
   */
  get allProductsInStock(): Product[] {
    return this.products.filter(
      p => p.typeProduct === 'PT' && p.status === 'A' && p.stock > 0
    );
  }

  /**
   * Obtiene los tipos únicos de productos disponibles
   * @returns Array de tipos de productos ordenados
   */
  getUniqueProductTypes(): string[] {
    const types = [...new Set(this.products.map(p => p.type))];
    return types.sort();
  }

  /**
   * Maneja el cambio de tipo de producto
   * Filtra productos disponibles según el tipo seleccionado
   * @param event Evento del select
   */
  onProductTypeChange(event: any): void {
    const selectedType = event.target.value;
    this.selectedProducts = [];
    this.selectedProductQuantities.clear();
    
    if (selectedType) {
      // Filtrar productos por tipo y ordenar por peso
      this.availableProductsForType = this.products
        .filter(p => p.type === selectedType && p.stock > 0)
        .sort((a, b) => a.packageWeight - b.packageWeight);
    } else {
      this.availableProductsForType = [];
    }
    
    this.calculateTotals();
  }

  /**
   * Maneja la selección/deselección de productos
   * @param product Producto seleccionado
   * @param event Evento del checkbox
   */
  onProductSelection(product: Product, event: any): void {
    if (event.target.checked) {
      if (!this.isProductSelected(product.id)) {
        this.setProductQuantity(product.id, 1);
        this.saleForm.patchValue({ typeProduct: product.typeProduct });
      }
    } else {
      this.setProductQuantity(product.id, 0);
    }
  }

  /**
   * Verifica si un producto está seleccionado
   * @param productId ID del producto
   * @returns true si está seleccionado
   */
  isProductSelected(productId: number): boolean {
    return this.getProductQuantity(productId) > 0;
  }

  /**
   * Función de tracking para ngFor (optimización de rendimiento)
   * @param index Índice del elemento
   * @param product Producto
   * @returns ID único del producto
   */
  trackByProductId(index: number, product: Product): number {
    return product.id;
  }

  /**
   * Genera una lista de pesos seleccionados para mostrar
   * @returns String con formato "peso x cantidad"
   */
  getSelectedWeightsList(): string {
    const weights: string[] = [];
    this.selectedProductQuantities.forEach((quantity, productId) => {
      const product = this.allProductsInStock.find(p => p.id === productId);
      if (product && quantity > 0) {
        weights.push(`${product.packageWeight}kg x${quantity}`);
      }
    });
    return weights.join(', ');
  }

  /**
   * Calcula el peso total de todos los productos seleccionados
   * @returns Peso total redondeado a 2 decimales
   */
  getTotalSelectedWeight(): number {
    let totalWeight = 0;
    this.selectedProductQuantities.forEach((quantity, productId) => {
      const product = this.allProductsInStock.find(p => p.id === productId);
      if (product) {
        totalWeight += quantity * product.packageWeight;
      }
    });
    return Math.round(totalWeight * 100) / 100;
  }

  /**
   * Calcula el stock total de todos los productos
   * @returns Stock total
   */
  getTotalStock(): number {
    return this.products?.reduce((total, product) => total + (product.stock || 0), 0) || 0;
  }

  /**
   * Carga los productos seleccionados para modo edición
   * Configura el tipo de producto y productos disponibles
   */
  private loadSelectedProductsForEdit(): void {
    if (this.saleData && this.mode !== 'create' && this.saleData.details?.length > 0) {
      const firstDetail = this.saleData.details[0];
      const selectedProduct = this.products.find(p => p.id === firstDetail.productId);

      if (selectedProduct) {
        this.saleForm.patchValue({
          typeProduct: selectedProduct.typeProduct,
          pricePerKg: firstDetail.pricePerKg,
          totalPrice: firstDetail.totalPrice
        });

        // Cargar productos disponibles para el tipo
        this.availableProductsForType = this.products
          .filter(p => p.type === selectedProduct.type && p.stock > 0)
          .sort((a, b) => a.packageWeight - b.packageWeight);

        // Para modo edit, incluir productos sin stock que están en la venta
        if (this.mode === 'edit') {
          const productIdsInSale = this.saleData.details?.map(d => d.productId) || [];
          const additionalProducts = this.products.filter(p => 
            p.type === selectedProduct.type && 
            productIdsInSale.includes(p.id) && 
            !this.availableProductsForType.some(ap => ap.id === p.id)
          );
          
          this.availableProductsForType = [...this.availableProductsForType, ...additionalProducts]
            .sort((a, b) => a.packageWeight - b.packageWeight);
        }
      }
    }
  }

  // ========================
  // MÉTODOS UTILITARIOS
  // ========================

  /**
   * Obtiene la fecha actual en formato YYYY-MM-DD
   * @returns Fecha actual
   */
  getCurrentDate(): string {
    return new Date().toISOString().split('T')[0];
  }

  /**
   * Formatea una fecha para el input de tipo date
   * @param dateString Fecha en formato string
   * @returns Fecha formateada para input
   */
  formatDateForInput(dateString: string): string {
    if (!dateString) return this.getCurrentDate();
    return dateString.split('T')[0];
  }

  /**
   * Calcula los totales de peso y precio
   * Actualiza automáticamente el campo totalPrice
   */
  calculateTotals(): void {
    const pricePerKg = parseFloat(this.saleForm.get('pricePerKg')?.value) || 0;
    const totalWeight = this.getTotalSelectedWeight();
    const totalPrice = totalWeight * pricePerKg;

    this.saleForm.patchValue({
      totalPrice: totalPrice.toFixed(2)
    });
  }

  // ========================
  // MÉTODOS PARA MANEJO DE ERRORES
  // ========================

  /**
   * Obtiene el mensaje de error para un campo específico
   * @param fieldName Nombre del campo
   * @returns Mensaje de error o string vacío
   */
  getFieldError(fieldName: string): string {
    const field = this.saleForm.get(fieldName);
    if (field && field.invalid && field.touched) {
      if (field.errors?.['required']) {
        return `${this.getFieldDisplayName(fieldName)} es requerido`;
      }
      if (field.errors?.['invalidName']) {
        return 'El nombre solo puede contener letras, espacios y ñ';
      }
      if (field.errors?.['invalidDocument']) {
        return 'Ingrese un DNI (8 dígitos) o RUC (11 dígitos) válido';
      }
      if (field.errors?.['min']) {
        return `${this.getFieldDisplayName(fieldName)} debe ser mayor a 0`;
      }
    }
    return '';
  }

  /**
   * Obtiene el nombre para mostrar de un campo
   * @param fieldName Nombre del campo
   * @returns Nombre para mostrar
   */
  private getFieldDisplayName(fieldName: string): string {
    const displayNames: { [key: string]: string } = {
      'name': 'Nombre',
      'ruc': 'Documento',
      'address': 'Dirección',
      'typeProduct': 'Tipo de Producto',
      'pricePerKg': 'Precio por Kg',
      'saleDate': 'Fecha de venta'
    };
    return displayNames[fieldName] || fieldName;
  }

  // ========================
  // MÉTODOS PARA ENVÍO DE FORMULARIO
  // ========================

  /**
   * Maneja el envío del formulario
   * Valida y procesa la creación o actualización de la venta
   */
  onSubmit(): void {
    if (this.saleForm.invalid || this.getTotalSelectedProducts() === 0) {
      this.saleForm.markAllAsTouched();
      this.errorMessage = 'Debe completar todos los campos requeridos y seleccionar al menos un producto.';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    const formData = this.prepareFormData();

    if (this.mode === 'create') {
      this.createSaleWithStockUpdate(formData);
    } else if (this.mode === 'edit') {
      this.updateSaleWithStockUpdate(formData);
    }
  }

  /**
   * Crea una nueva venta y actualiza el stock de productos
   * @param sale Datos de la venta a crear
   */
  private createSaleWithStockUpdate(sale: Sale): void {
    this.saleService.createSale(sale).subscribe({
      next: (createdSale: Sale) => {
        const stockUpdates: Observable<any>[] = [];
        
        // Crear operaciones de reducción de stock para cada producto
        this.selectedProductQuantities.forEach((quantity, productId) => {
          const product = this.products.find(p => p.id === productId);
          if (product && quantity > 0) {
            console.log(`Reduciendo stock del producto ${product.id} en ${quantity} unidades`);
            stockUpdates.push(this.productService.reduceStock(productId, quantity));
          }
        });

        // Ejecutar todas las actualizaciones de stock
        if (stockUpdates.length > 0) {
          forkJoin(stockUpdates).subscribe({
            next: () => {
              this.saleCreated.emit(createdSale);
              this.isLoading = false;
              this.closeModal.emit();
            },
            error: (err) => {
              console.error('Error detallado:', err);
              this.errorMessage = `Error al actualizar stock: ${err.message || JSON.stringify(err)}`;
              this.isLoading = false;
            }
          });
        } else {
          // Si no hay actualizaciones de stock, solo emitir evento
          this.saleCreated.emit(createdSale);
          this.isLoading = false;
          this.closeModal.emit();
        }
      },
      error: (err) => {
        console.error('Error al crear venta:', err);
        this.errorMessage = `Error al crear venta: ${err.message || JSON.stringify(err)}`;
        this.isLoading = false;
      }
    });
  }

  /**
   * Actualiza una venta existente y ajusta el stock según los cambios
   * @param saleData Datos actualizados de la venta
   */
  private updateSaleWithStockUpdate(saleData: Sale): void {
    if (saleData.id == null) {
      this.errorMessage = 'ID de la venta no válido';
      this.isLoading = false;
      return;
    }

    const stockOperations: Observable<any>[] = [];
    
    // Obtener las cantidades originales de la venta
    const originalQuantities = new Map<number, number>();
    if (this.originalSaleData?.details) {
      this.originalSaleData.details.forEach(detail => {
        const currentCount = originalQuantities.get(detail.productId) || 0;
        originalQuantities.set(detail.productId, currentCount + detail.packages);
      });
    }

    // Comparar cantidades y crear operaciones de stock
    this.selectedProductQuantities.forEach((newQuantity, productId) => {
      const originalQuantity = originalQuantities.get(productId) || 0;
      const difference = newQuantity - originalQuantity;
      
      if (difference !== 0) {
        const product = this.products.find(p => p.id === productId);
        if (product) {
          if (difference > 0) {
            // Se aumentó la cantidad, reducir más stock
            console.log(`Reduciendo stock adicional del producto ${productId} en ${difference} unidades`);
            stockOperations.push(this.productService.reduceStock(productId, difference));
          } else {
            // Se redujo la cantidad, devolver stock
            console.log(`Devolviendo stock del producto ${productId} en ${Math.abs(difference)} unidades`);
            stockOperations.push(this.productService.increaseStock(productId, Math.abs(difference)));
          }
        }
      }
    });

    // Verificar productos que fueron removidos completamente
    originalQuantities.forEach((originalQuantity, productId) => {
      if (!this.selectedProductQuantities.has(productId)) {
        // Este producto fue removido completamente, devolver todo su stock
        console.log(`Devolviendo todo el stock del producto ${productId}: ${originalQuantity} unidades`);
        stockOperations.push(this.productService.increaseStock(productId, originalQuantity));
      }
    });

    // Actualizar la venta
    const updateSale$ = this.saleService.updateSale(saleData.id, saleData);

    // Ejecutar todas las operaciones (venta + stock)
    if (stockOperations.length > 0) {
      forkJoin([updateSale$, ...stockOperations]).subscribe({
        next: ([updatedSale, ...stockResults]) => {
          console.log('Venta actualizada y stock ajustado:', {
            updatedSale,
            operacionesStock: stockResults.length
          });
          this.saleUpdated.emit(updatedSale);
          this.handleClose();
          this.isLoading = false;
        },
        error: (error: any) => {
          console.error('Error al actualizar venta o ajustar stock:', error);
          this.errorMessage = `Error al actualizar: ${error.message || 'Error desconocido'}`;
          this.isLoading = false;
        }
      });
    } else {
      // Solo actualizar la venta si no hay cambios de stock
      updateSale$.subscribe({
        next: (updatedSale) => {
          console.log('Venta actualizada sin cambios de stock');
          this.saleUpdated.emit(updatedSale);
          this.handleClose();
          this.isLoading = false;
        },
        error: (error: any) => {
          console.error('Error al actualizar venta:', error);
          this.errorMessage = `Error al actualizar: ${error.message || 'Error desconocido'}`;
          this.isLoading = false;
        }
      });
    }
  }

  /**
   * Prepara los datos del formulario para envío
   * Convierte el formulario y productos seleccionados en objeto Sale
   * @returns Objeto Sale preparado para envío
   */
  prepareFormData(): Sale {
    const formValue = this.saleForm.getRawValue();
    const details = this.convertToSaleDetails();

    const saleData: Sale = {
      id: this.mode === 'edit' ? formValue.id : 0,
      saleDate: formValue.saleDate,
      name: formValue.name,
      ruc: formValue.ruc,
      address: formValue.address,
      details: details
    };

    return saleData;
  }
  
  /**
   * Maneja el cierre del modal
   * Confirma si hay cambios no guardados y limpia el estado
   */
  handleClose(): void {
    // Confirmar cierre si hay cambios no guardados (excepto en modo view)
    if (this.saleForm.dirty && this.mode !== 'view') {
      const confirmExit = confirm('¿Seguro que deseas cerrar? Se perderán los cambios no guardados.');
      if (!confirmExit) return;
    }
    
    // Limpiar estado del componente
    this.isLoading = false;
    this.errorMessage = '';
    this.selectedProducts = [];
    this.selectedProductQuantities.clear();
    this.availableProductsForType = [];
    this.closeModal.emit();
    this.saleForm.reset();
  }
}