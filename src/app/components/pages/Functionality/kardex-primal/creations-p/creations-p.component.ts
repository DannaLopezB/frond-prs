import { Component, EventEmitter, Input, Output, OnInit } from '@angular/core';
import { ProductService } from '../../../../../../service/product.service';
import { Product } from '../../../../../../interfaces/Product';
import { TypeKardexService } from '../../../../../../service/type-kardex.service';
import { TypeKardex } from '../../../../../../interfaces/TypeKardex';
import { FormsModule } from '@angular/forms';
import { NgIf, NgClass, NgFor, CommonModule } from '@angular/common';
import { ShedService } from '../../../../../../service/shed.service';
import { Shed } from '../../../../../../interfaces/Shed';
import { SupplierService } from '../../../../../../service/supplier.service';
import { Supplier } from '../../../../../../interfaces/Supplier';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-creations-p',
  standalone: true,
  imports: [FormsModule, CommonModule, NgIf, NgClass, NgFor],
  templateUrl: './creations-p.component.html',
  styleUrl: './creations-p.component.css'
})
export class CreationsPComponent implements OnInit {
@Input() isOpen = false;
  @Input() isEditMode = false;
  @Input() typeKardex: TypeKardex = this.getDefaultTypeKardex();
  @Output() close = new EventEmitter<void>();
  @Output() kardexUpdated = new EventEmitter<TypeKardex>(); // Changed name to be more specific

  products: Product[] = [];
  suppliers: Supplier[] = [];
  sheds: Shed[] = [];

  constructor(
    private typeKardexService: TypeKardexService,
    private productService: ProductService,
    private supplierService: SupplierService,
    private shedService: ShedService
  ) {}

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.loadProducts();
    this.loadSuppliers();
    this.loadSheds();
  }

  loadProducts() {
    this.productService.getAll().subscribe(
      products => {
        // Filter products to only include those with status 'A' and typeProduct 'PT'
        this.products = products.filter(product => 
          product.status === 'A' && product.typeProduct === 'MP'
        );
      },
      error => console.error('Error al obtener productos:', error)
    );
  }

  loadSuppliers() {
    this.supplierService.getAll().subscribe(
      suppliers => {
        // Filter suppliers to only include those with status 'A'
        this.suppliers = suppliers.filter(supplier => supplier.status === 'A');
      },
      error => console.error('Error al obtener proveedores:', error)
    );
  }

  loadSheds() {
    this.shedService.getAll().subscribe(
      sheds => {
        // Filter sheds to only include those with status 'A'
        this.sheds = sheds.filter(shed => shed.status === 'A');
      },
      error => console.error('Error al obtener galpones:', error)
    );
  }

  closeModal() {
    this.close.emit();
  }

  onSubmit() {
    if (this.isEditMode) {
      this.typeKardexService.update(this.typeKardex.id, this.typeKardex).subscribe((updatedKardex) => {
        this.handleSuccess('¡Registro actualizado con éxito!', updatedKardex);
      });
    } else {
      const { id, ...typeKardexData } = this.typeKardex;
      const newTypeKardex = { ...typeKardexData, status: 'A' } as TypeKardex;
      this.typeKardexService.create(newTypeKardex).subscribe((createdKardex) => {
        this.handleSuccess('¡Registro creado con éxito!', createdKardex);
      });
    }
  }

  private handleSuccess(message: string, kardex: TypeKardex) {
    Swal.fire({
      title: 'Éxito',
      text: message,
      icon: 'success',
      timer: 2000,
      showConfirmButton: false,
      backdrop: true,
      allowOutsideClick: false,
      allowEscapeKey: false
    });

    this.kardexUpdated.emit(kardex); // Emit the updated/new kardex data
    this.closeModal();
  }

  private getDefaultTypeKardex(): TypeKardex {
    return {
      id: 0,
      name: '',
      maximumAmount: 0,
      minimumQuantity: 0,
      supplierId: 0,
      productId: 0,
      shedId: 0,
      description: '',
      status: 'A'
    };
  }
}