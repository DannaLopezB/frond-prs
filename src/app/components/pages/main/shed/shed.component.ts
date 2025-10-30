import { Component, OnInit, OnDestroy } from '@angular/core';
import { Shed } from '../../../../../interfaces/Shed';
import { ShedService } from '../../../../../service/shed.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import Swal from 'sweetalert2';
//Proveedor
import { SupplierService } from '../../../../../service/supplier.service';
import { Supplier } from '../../../../../interfaces/Supplier';
import { Hen } from '../../../../../interfaces/Hen';
import { HenService } from '../../../../../service/hen.service';

@Component({
  selector: 'app-shed',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './shed.component.html',
  styleUrls: ['./shed.component.css']
})
export class ShedComponent implements OnInit, OnDestroy {
  sheds: Shed[] = [];
  paginatedSheds: Shed[] = [];
  statusActive: boolean = true;
  currentPage: number = 1;
  itemsPerPage: number = 5;
  suppliers: Supplier[] = [];
  hens: Hen[] = []; // Array para almacenar las gallinas
  isMobile: boolean = false;
  
  // Modal properties
  showModal: boolean = false;
  editMode: boolean = false;
  currentShed: Shed = this.initializeShed();

  constructor(
    private shedService: ShedService,
    private supplierService: SupplierService,
    private henService: HenService // Inyección del servicio de gallinas
  ) {
    // Determinar si es dispositivo móvil al inicio
    this.checkScreenSize();
    // Escuchar cambios en el tamaño de la ventana
    window.addEventListener('resize', this.checkScreenSize.bind(this));
  }
  
  ngOnInit(): void {
    this.loadSheds();
    this.loadSuppliers();
    this.loadHens(); // Cargar gallinas al inicializar
  }

  // Método para verificar el tamaño de la pantalla
  checkScreenSize(): void {
    this.isMobile = window.innerWidth < 768; // 768px es el breakpoint de Tailwind para md
    
    // Ajustar elementos por página basado en tamaño de pantalla
    this.itemsPerPage = this.isMobile ? 3 : 5;
    this.updatePagination();
  }

  // Initialize empty shed
  initializeShed(): Shed {
    return {
      id: 0,
      name: '',
      location: '',
      capacity: 0,
      chickenType: 0, // Changed back to 0 to match interface
      inspectionDate: new Date().toISOString().split('T')[0], // Today's date in yyyy-MM-dd format
      note: '',
      supplierId: null as any,
      status: 'A'
    };
  }

  // Open modal for creating a new shed
  openCreateModal(): void {
    this.editMode = false;
    this.currentShed = this.initializeShed();
    this.showModal = true;
  }

  // Open modal for editing an existing shed
  openEditModal(shed: Shed): void {
    this.editMode = true;
    // Create a deep copy to avoid modifying the original object
    this.currentShed = { ...shed };
    
    // Format the date properly for the date input
    if (this.currentShed.inspectionDate) {
      // If it's a Date object or a string date
      const date = new Date(this.currentShed.inspectionDate);
      this.currentShed.inspectionDate = date.toISOString().split('T')[0];
    }
    
    this.showModal = true;
  }

  // Close modal
  closeModal(): void {
    this.showModal = false;
  }

  // Check if the form is valid
  isFormInvalid(): boolean {
    return !this.currentShed.name || 
           !this.currentShed.location || 
           !this.currentShed.capacity || 
           !this.currentShed.chickenType || // This will check for 0, which is falsy
           !this.currentShed.inspectionDate || 
           !this.currentShed.supplierId;
  }

  // Save form (create or update)
  saveForm(): void {
    if (this.isFormInvalid()) {
      Swal.fire({
        title: 'Error',
        text: 'Por favor complete todos los campos requeridos',
        icon: 'error',
        confirmButtonText: 'Entendido'
      });
      return;
    }

    if (this.editMode) {
      this.updateShed();
    } else {
      this.createShed();
    }
  }

  // Create a new shed
  createShed(): void {
    // Create a new object with all properties except id
    const shedToCreate = {
      name: this.currentShed.name,
      location: this.currentShed.location,
      capacity: this.currentShed.capacity,
      chickenType: this.currentShed.chickenType,
      inspectionDate: this.currentShed.inspectionDate,
      note: this.currentShed.note,
      supplierId: this.currentShed.supplierId,
      status: this.currentShed.status
    };

    // Debug log para verificar qué se está enviando
    console.log('Datos a enviar:', shedToCreate);

    this.shedService.create(shedToCreate as Shed).subscribe({
      next: (response) => {
        console.log('Respuesta del servidor:', response);
        this.sheds.push(response);
        this.updatePagination();
        this.closeModal();
        Swal.fire({
          title: 'Éxito',
          text: 'Galpón creado correctamente',
          icon: 'success',
          confirmButtonText: 'Aceptar'
        });
      },
      error: (err) => {
        console.error('Error al crear galpón:', err);
        Swal.fire({
          title: 'Error',
          text: 'No se pudo crear el galpón',
          icon: 'error',
          confirmButtonText: 'Aceptar'
        });
      }
    });
  }

  // Update an existing shed
  updateShed(): void {
    const id = this.currentShed.id;
    
    // Debug log para verificar qué se está enviando
    console.log('Datos a actualizar:', this.currentShed);
    
    this.shedService.update(id, this.currentShed).subscribe({
      next: (response) => {
        console.log('Respuesta del servidor:', response);
        // Update the shed in the array
        const index = this.sheds.findIndex(s => s.id === id);
        if (index !== -1) {
          this.sheds[index] = response;
        }
        this.updatePagination();
        this.closeModal();
        Swal.fire({
          title: 'Éxito',
          text: 'Galpón actualizado correctamente',
          icon: 'success',
          confirmButtonText: 'Aceptar'
        });
      },
      error: (err) => {
        console.error('Error al actualizar galpón:', err);
        Swal.fire({
          title: 'Error',
          text: 'No se pudo actualizar el galpón',
          icon: 'error',
          confirmButtonText: 'Aceptar'
        });
      }
    });
  }

  // Cargar gallinas activas
  loadHens(): void {
    this.henService.getHens().subscribe({
      next: (data) => {
        // Filtrar solo las gallinas activas
        this.hens = data.filter(hen => hen.status === 'A');
        console.log('Gallinas cargadas:', this.hens);
      },
      error: (err) => {
        console.error('Error al cargar gallinas:', err);
        this.hens = [];
      }
    });
  }

  // Obtener información de gallina por ID
  getHenInfo(henId: number | null): string {
    if (!henId || henId === 0) return 'N/A';
    
    const hen = this.hens.find(h => h.id === henId);
    if (hen) {
      const arrivalDate = new Date(hen.arrivalDate).toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
      return `${hen.henType} - ${arrivalDate}`;
    }
    return 'N/A';
  }

  // Método para manejar el cambio de tipo de gallina (para debug)
  onHenTypeChange(event: any): void {
    const henId = event.target.value;
    console.log('Hen ID seleccionado:', henId);
    console.log('Tipo de dato:', typeof henId);
    console.log('currentShed.chickenType:', this.currentShed.chickenType);
    
    // Asegurarse de que el valor sea un número
    if (henId && henId !== 'null' && henId !== '') {
      this.currentShed.chickenType = parseInt(henId, 10);
    } else {
      this.currentShed.chickenType = 0; // Use 0 instead of null
    }
    
    console.log('currentShed.chickenType después del cambio:', this.currentShed.chickenType);
  }

  loadSuppliers(): void {
    this.supplierService.getAll().subscribe((data) => {
      this.suppliers = data;
    });
  }

  getSupplierCompany(supplierId: number): string {
    const supplier = this.suppliers.find(s => s.id === supplierId);
    return supplier ? supplier.company : 'N/A';
  }
  
  loadSheds(): void {
    this.shedService.getAll().subscribe((data) => {
      this.sheds = data;
      this.updatePagination();
    });
  }

  updatePagination(): void {
    // Get sheds based on current status filter
    const filteredSheds = this.sheds
      .filter((shed) => (this.statusActive ? shed.status === 'A' : shed.status === 'I'));
    
    // Calculate max pages
    const maxPage = Math.max(1, Math.ceil(filteredSheds.length / this.itemsPerPage));
    
    // Ensure current page is valid
    if (this.currentPage > maxPage) {
      this.currentPage = maxPage;
    }
    
    // Update paginated sheds
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    this.paginatedSheds = filteredSheds.slice(startIndex, startIndex + this.itemsPerPage);
  }

  cambiarPagina(page: number): void {
    const maxPage = this.getPages().length;
    if (page > 0 && page <= maxPage) {
      this.currentPage = page;
      this.updatePagination();
    }
  }

  getPages(): number[] {
    const filteredCount = this.sheds.filter(shed => 
      this.statusActive ? shed.status === 'A' : shed.status === 'I'
    ).length;
    
    const pageCount = Math.max(1, Math.ceil(filteredCount / this.itemsPerPage));
    return Array(pageCount).fill(0).map((_, index) => index + 1);
  }

  // Método para mostrar un número limitado de botones de página en dispositivos móviles
  getVisiblePageNumbers(): number[] {
    const allPages = this.getPages();
    const totalPages = allPages.length;
    
    // Si hay 5 o menos páginas, mostrar todas
    if (totalPages <= 5) {
      return allPages;
    }
    
    // En móviles mostrar menos páginas
    if (this.isMobile) {
      // Mostrar 3 páginas: actual, anterior y siguiente (si existen)
      if (this.currentPage === 1) {
        return [1, 2, 3];
      } else if (this.currentPage === totalPages) {
        return [totalPages - 2, totalPages - 1, totalPages];
      } else {
        return [this.currentPage - 1, this.currentPage, this.currentPage + 1];
      }
    } else {
      // En pantallas más grandes mostrar 5 páginas
      if (this.currentPage <= 3) {
        return [1, 2, 3, 4, 5];
      } else if (this.currentPage >= totalPages - 2) {
        return [totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
      } else {
        return [this.currentPage - 2, this.currentPage - 1, this.currentPage, this.currentPage + 1, this.currentPage + 2];
      }
    }
  }

  toggleStatus(event: boolean): void {
    this.statusActive = event;
    this.currentPage = 1; // Reset to first page when toggling view
    this.updatePagination();
  }

  softDelete(id: number): void {
    const shed = this.sheds.find((s) => s.id === id);
    if (shed) {
      Swal.fire({
        title: '¿Estás seguro?',
        text: '¿Deseas desactivar este galpón?',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Sí, desactivar',
        cancelButtonText: 'Cancelar'
      }).then((result) => {
        if (result.isConfirmed) {
          // Create a copy of the shed to avoid direct mutation
          const updatedShed: Shed = {
            ...shed,
            status: 'I'
          };
          
          this.shedService.update(id, updatedShed).subscribe({
            next: () => {
              // Update local data immediately for better UX
              const index = this.sheds.findIndex(s => s.id === id);
              if (index !== -1) {
                this.sheds[index] = updatedShed;
              }
              
              // Update pagination with current status filter
              this.updatePagination();
              
              Swal.fire({
                title: '¡Desactivado!',
                text: 'El galpón ha sido desactivado.',
                icon: 'success',
                confirmButtonText: 'Aceptar',
                timer: 1500
              });
            },
            error: (err) => {
              console.error('Error al desactivar galpón:', err);
              Swal.fire({
                title: '¡Error!',
                text: 'No se pudo desactivar el galpón.',
                icon: 'error',
                confirmButtonText: 'Aceptar'
              });
            }
          });
        }
      });
    }
  }

  restore(id: number): void {
    const shed = this.sheds.find((s) => s.id === id);
    if (shed) {
      Swal.fire({
        title: '¿Estás seguro?',
        text: '¿Deseas activar este galpón?',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Sí, activar',
        cancelButtonText: 'Cancelar'
      }).then((result) => {
        if (result.isConfirmed) {
          // Create a copy of the shed to avoid direct mutation
          const updatedShed: Shed = {
            ...shed,
            status: 'A'
          };
          
          this.shedService.update(id, updatedShed).subscribe({
            next: () => {
              // Update local data immediately for better UX
              const index = this.sheds.findIndex(s => s.id === id);
              if (index !== -1) {
                this.sheds[index] = updatedShed;
              }
              
              // Update pagination with current status filter
              this.updatePagination();
              
              Swal.fire({
                title: '¡Activado!',
                text: 'El galpón ha sido activado.',
                icon: 'success',
                confirmButtonText: 'Aceptar',
                timer: 1500
              });
            },
            error: (err) => {
              console.error('Error al activar galpón:', err);
              Swal.fire({
                title: '¡Error!',
                text: 'No se pudo activar el galpón.',
                icon: 'error',
                confirmButtonText: 'Aceptar'
              });
            }
          });
        }
      });
    }
  }

  // Destructor: eliminar event listener al destruir el componente
  ngOnDestroy(): void {
    window.removeEventListener('resize', this.checkScreenSize.bind(this));
  }
}