import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import Swal from 'sweetalert2';
import { Product } from '../../../../../../interfaces/Product';
import { ConsumptionService } from '../../../../../../service/consumption.service';
import { ProductService } from '../../../../../../service/product.service';

@Component({
  selector: 'app-form-consumption',
  templateUrl: './form-consumption.component.html',
  styleUrls: ['./form-consumption.component.css'],
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule
  ]
})
export class FormConsumptionComponent implements OnInit {
  @Input() consumptionData: any;
  @Output() onClose = new EventEmitter<boolean>();

  consumptionForm!: FormGroup;
  homes: any[] = [];
  products: Product[] = [];
  filteredProducts: Product[] = [];
  selectedProduct: Product | null = null;
  isEditing: boolean = false;

  constructor(
    private fb: FormBuilder,
    private consumptionService: ConsumptionService,
    private productService: ProductService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.isEditing = !!this.consumptionData?.id_consumption;
    this.initializeForm();
    this.loadHomes();
    this.loadProducts();
  }

  initializeForm(): void {
    this.consumptionForm = this.fb.group({
      id_consumption: new FormControl(this.consumptionData?.id_consumption || null),
      date: new FormControl(this.consumptionData?.date || '', [Validators.required]),
      id_home: new FormControl(this.consumptionData?.id_home || '', [Validators.required]),
      productId: new FormControl(this.consumptionData?.productId || '', [Validators.required]),
      quantity: new FormControl(this.consumptionData?.quantity || '', [
        Validators.required,
        Validators.min(1)
      ]),
      weight: new FormControl({
        value: this.consumptionData?.weight || '',
        disabled: true
      }),
      price: new FormControl(this.consumptionData?.price || '', [
        Validators.required,
        Validators.min(0.01)
      ]),
      salevalue: new FormControl({
        value: this.consumptionData?.salevalue || '',
        disabled: true
      }),
      status: new FormControl(this.consumptionData?.status || 'A')
    });

    this.setupFormListeners();
  }

  setupFormListeners(): void {
    this.consumptionForm.get('quantity')?.valueChanges.subscribe(() => this.onQuantityChange());
    this.consumptionForm.get('price')?.valueChanges.subscribe(() => this.onPriceChange());
    this.consumptionForm.get('productId')?.valueChanges.subscribe(() => this.onProductChange());
  }

  loadHomes(): void {
    this.consumptionService.getHomes().subscribe({
      next: (data) => {
        this.homes = data.filter((home) => home.status === "A");
      },
      error: (error) => {
        console.error('Error al cargar las casas', error);
        Swal.fire('Error', 'No se pudieron cargar las casas', 'error');
      }
    });
  }

  loadProducts(): void {
    this.productService.getAll().subscribe({
      next: (data) => {
        // Filtrar solo productos activos
        this.products = data.filter(product => product.status === 'A');
        this.filteredProducts = [...this.products];
        
        if (this.isEditing && this.consumptionData?.productId) {
          this.productService.getById(this.consumptionData.productId).subscribe({
            next: (product) => {
              // Verificar si el producto está activo antes de mostrarlo
              if (product.status === 'A') {
                this.selectedProduct = product;
                this.consumptionForm.patchValue({
                  productId: product.id,
                  price: product.pricePerKg
                });
              } else {
                Swal.fire('Advertencia', 'El producto asociado a este consumo está inactivo', 'warning');
              }
              this.cdr.detectChanges();
            },
            error: (error) => {
              console.error('Error al cargar el producto', error);
            }
          });
        }
      },
      error: (error) => {
        console.error('Error al cargar los productos', error);
        Swal.fire('Error', 'No se pudieron cargar los productos', 'error');
      }
    });
  }

  onProductChange(): void {
    const productId = this.consumptionForm.get('productId')?.value;
    if (productId) {
      const selectedProduct = this.products.find(p => p.id === +productId);
      if (selectedProduct) {
        this.selectedProduct = selectedProduct;
        this.consumptionForm.patchValue({
          price: selectedProduct.pricePerKg
        }, { emitEvent: false });
      }
    } else {
      this.selectedProduct = null;
    }
    this.onQuantityChange();
    this.cdr.detectChanges();
  }

  onQuantityChange(): void {
    const quantity = this.consumptionForm.get('quantity')?.value;
    if (quantity) {
      const weight = quantity / 15.5; // 15.5 huevos = 1 kg
      this.consumptionForm.patchValue({
        weight: weight.toFixed(2)
      }, { emitEvent: false });
      this.onPriceChange();
    }
  }

  onPriceChange(): void {
    const weight = this.consumptionForm.get('weight')?.value;
    const price = this.consumptionForm.get('price')?.value;
    if (weight && price) {
      const salevalue = weight * price;
      this.consumptionForm.patchValue({
        salevalue: salevalue.toFixed(2)
      }, { emitEvent: false });
    }
  }

  submitForm(): void {
    if (this.consumptionForm.invalid) {
      this.markAllAsTouched();
      Swal.fire('Error', 'Por favor complete todos los campos requeridos', 'error');
      return;
    }

    const formData = this.consumptionForm.getRawValue();
    const formattedDate = new Date(formData.date).toISOString().split('T')[0];

    const consumptionData = {
      ...formData,
      date: formattedDate,
      id_home: Number(formData.id_home),
      productId: Number(formData.productId),
      quantity: Number(formData.quantity),
      weight: parseFloat(formData.weight),
      price: parseFloat(formData.price),
      salevalue: parseFloat(formData.salevalue),
    };

    const request = this.isEditing 
      ? this.consumptionService.updateConsumption(consumptionData.id_consumption, consumptionData)
      : this.consumptionService.registerConsumption(consumptionData);

    request.subscribe({
      next: () => {
        Swal.fire(
          'Éxito',
          this.isEditing ? 'Consumo actualizado correctamente' : 'Consumo registrado correctamente',
          'success'
        );
        this.onClose.emit(true);
      },
      error: (error) => {
        console.error('Error:', error);
        Swal.fire(
          'Error',
          this.isEditing ? 'No se pudo actualizar el consumo' : 'No se pudo registrar el consumo',
          'error'
        );
      }
    });
  }

  markAllAsTouched(): void {
    Object.values(this.consumptionForm.controls).forEach(control => {
      control.markAsTouched();
    });
  }

  cancel(): void {
    this.onClose.emit(false);
  }
}