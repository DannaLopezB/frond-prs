import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { MovementKardex } from '../../../../../../interfaces/MovementKardex';
import { MovementKardexService } from '../../../../../../service/movement-kardex.service';
import { TypeKardex } from '../../../../../../interfaces/TypeKardex';
import { TypeKardexService } from '../../../../../../service/type-kardex.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import Swal from 'sweetalert2';
import { BehaviorSubject, Subject, debounceTime, distinctUntilChanged, switchMap, takeUntil } from 'rxjs';
@Component({
  selector: 'app-modal-kardex-pr',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './modal-kardex-pr.component.html',
  styleUrl: './modal-kardex-pr.component.css'
})
export class ModalKardexPrComponent {
@Input() isEdit: boolean = false;
  @Input() movementKardex: MovementKardex = {} as MovementKardex;
  @Input() fixedKardexType: boolean = true;
  
  @Output() closeModal = new EventEmitter<void>();
  @Output() movementUpdated = new EventEmitter<MovementKardex>();

  kardexTypes: TypeKardex[] = [];
  showEntrada: boolean = true;
  selectedKardexType: TypeKardex | null = null;
  
  // Stock actual con BehaviorSubject para actualizaciones reactivas
  private currentStockSubject = new BehaviorSubject<number>(0);
  currentStock: number = 0;
  
  // Control para límites de stock
  stockLimitsExceeded: boolean = false;
  
  // Para manejo de subscripciones
  private destroy$ = new Subject<void>();
  
  // Para detectar cambios en el tipo de kardex - Modificado de string a number
  private kardexTypeChanged$ = new BehaviorSubject<number | null>(null);

  constructor(
    private movementKardexService: MovementKardexService,
    private typeKardexService: TypeKardexService
  ) {}

  ngOnInit(): void {
    this.loadModalKardexTypes();
    
    // Suscribirse a cambios en el tipo de kardex para actualizar el stock
    this.kardexTypeChanged$
      .pipe(
        takeUntil(this.destroy$),
        debounceTime(300),
        distinctUntilChanged(),
        switchMap(typeId => {
          if (!typeId) return [];
          return this.movementKardexService.getAll();
        })
      )
      .subscribe(movements => {
        if (this.movementKardex.typeKardexId) {
          this.updateCurrentStock(movements);
        }
      });
    
    // Iniciar la carga del stock actual
    if (this.movementKardex.typeKardexId) {
      this.kardexTypeChanged$.next(this.movementKardex.typeKardexId);
    }
    
    // Suscribirse a actualizaciones de stock
    this.currentStockSubject.subscribe(stock => {
      this.currentStock = stock;
      // Validar límites cada vez que el stock cambia
      this.updateStockLimitsValidation();
    });
  }
  
  ngOnChanges(changes: SimpleChanges): void {
    // Detectar cambios en movementKardex, especialmente en typeKardexId
    if (changes['movementKardex'] && 
        this.movementKardex && 
        this.movementKardex.typeKardexId) {
      // Actualizar el tipo seleccionado
      this.selectedKardexType = this.kardexTypes.find(
        type => type.id === this.movementKardex.typeKardexId
      ) || null;
      
      // Actualizar el stock actual
      this.kardexTypeChanged$.next(this.movementKardex.typeKardexId);
      
      // Forzar recarga del stock cuando se abre el modal para editar
      this.loadCurrentStock();
    }
  }
  
  ngOnDestroy(): void {
    // Limpiar todas las suscripciones
    this.destroy$.next();
    this.destroy$.complete();
    this.currentStockSubject.complete();
    this.kardexTypeChanged$.complete();
  }

  loadModalKardexTypes(): void {
    this.typeKardexService.listAll().subscribe({
      next: (types) => {
        this.kardexTypes = types;
        
        // Si tenemos un typeKardexId en el movimiento, encontrar el objeto de tipo correspondiente
        if (this.movementKardex && this.movementKardex.typeKardexId) {
          this.selectedKardexType = this.kardexTypes.find(
            type => type.id === this.movementKardex.typeKardexId
          ) || null;
          
          // Cargar el stock actual después de cargar los tipos
          this.loadCurrentStock();
        }
      },
      error: (err) => console.error('Error al cargar tipos de Kardex en el modal:', err)
    });
  }

  // Método actualizado para cargar el stock actual del producto seleccionado
  loadCurrentStock(): void {
    if (!this.movementKardex || !this.movementKardex.typeKardexId) return;
    
    // Obtener todos los movimientos para este kardex - Forzar recarga con timestamp
    this.movementKardexService.getAll().subscribe({
      next: (movements) => {
        this.updateCurrentStock(movements);
      },
      error: (err) => console.error('Error al cargar el stock actual:', err)
    });
  }
  
  // Método mejorado para actualizar el stock actual
  updateCurrentStock(movements: MovementKardex[]): void {
    if (!this.movementKardex.typeKardexId) return;
    
    // Filtramos por el kardex actual y ordenamos por fecha (descendente)
    const kardexMovements = movements
      .filter(m => m.typeKardexId === this.movementKardex.typeKardexId)
      .sort((a, b) => {
        // Ordenar primero por fecha
        const dateA = new Date(a.issueDate).getTime();
        const dateB = new Date(b.issueDate).getTime();
        
        if (dateA !== dateB) return dateB - dateA;
        
        // Si las fechas son iguales, ordenar por ID (asumiendo que IDs más altos son más recientes)
        // Esta es una comprobación extra para garantizar que obtenemos el último movimiento
        return (b.kardexId || 0) - (a.kardexId || 0);
      });
    
    // Si hay movimientos previos, tomamos el saldo del más reciente
    if (kardexMovements.length > 0) {
      const latestMovement = kardexMovements[0];
      // Asegurarnos que el saldo no sea null o undefined
      const latestStock = latestMovement.cantidadSaldo !== null && 
                         latestMovement.cantidadSaldo !== undefined ? 
                         latestMovement.cantidadSaldo : 0;
      
      console.log('Último movimiento encontrado:', latestMovement);
      console.log('Último saldo registrado:', latestStock);
      
      // Si estamos en modo edición y el movimiento es el mismo que estamos editando, 
      // ajustamos para no contar el movimiento actual dos veces
      if (this.isEdit && this.movementKardex.kardexId === latestMovement.kardexId) {
        console.log('Ajustando saldo para edición del movimiento actual');
        // Calcular stock antes de este movimiento
        if (latestMovement.cantidadEntrada && latestMovement.cantidadEntrada > 0) {
          // Si fue una entrada, restar la cantidad
          this.currentStockSubject.next(latestStock - latestMovement.cantidadEntrada);
        } else if (latestMovement.cantidadSalida && latestMovement.cantidadSalida > 0) {
          // Si fue una salida, sumar la cantidad
          this.currentStockSubject.next(latestStock + latestMovement.cantidadSalida);
        } else {
          this.currentStockSubject.next(latestStock);
        }
      } else {
        // Si no estamos editando el último movimiento, simplemente usamos su saldo
        this.currentStockSubject.next(latestStock);
      }
    } else {
      console.log('No se encontraron movimientos para este tipo de kardex');
      this.currentStockSubject.next(0);
    }
  }

  get modalValorTotalEntrada(): number {
    const { cantidadEntrada = 0, costoUnitarioEntrada = 0 } = this.movementKardex;
    return cantidadEntrada * costoUnitarioEntrada;
  }

  // Obtener el nombre del tipo de kardex seleccionado actualmente
  get selectedKardexName(): string {
    if (this.selectedKardexType) {
      return this.selectedKardexType.name;
    }
    
    // Si aún no hemos cargado los objetos de tipo, pero tenemos un ID
    if (this.movementKardex && this.movementKardex.typeKardexId) {
      const type = this.kardexTypes.find(t => t.id === this.movementKardex.typeKardexId);
      return type ? type.name : 'Cargando...';
    }
    
    return 'Seleccione un tipo';
  }

  // Método para verificar si el stock está dentro de los límites
  checkStockLimits(): boolean {
    if (!this.selectedKardexType) return true;

    const maxAmount = this.selectedKardexType.maximumAmount;
    const minAmount = this.selectedKardexType.minimumQuantity;
    
    // Para entradas, validamos que no se exceda el máximo
    if (this.showEntrada) {
      const newStock = this.currentStock + (this.movementKardex.cantidadEntrada || 0);
      return newStock <= maxAmount;
    } 
    // Para salidas, validamos que no se caiga por debajo del mínimo
    else {
      const newStock = this.currentStock - (this.movementKardex.cantidadSalida || 0);
      return newStock >= minAmount;
    }
  }

  // Actualizar el estado de validación cuando cambian los valores
  updateStockLimitsValidation(): void {
    this.stockLimitsExceeded = !this.checkStockLimits();
    
    // Si los límites se exceden y hay cantidades ingresadas, mostrar una alerta
    if (this.stockLimitsExceeded && this.selectedKardexType) {
      if (this.showEntrada && this.movementKardex.cantidadEntrada) {
        const newStock = this.currentStock + this.movementKardex.cantidadEntrada;
        Swal.fire({
          title: 'Límite de stock excedido',
          text: `La cantidad ingresada excede el límite máximo permitido (${this.selectedKardexType.maximumAmount}). El stock resultante sería ${newStock}.`,
          icon: 'warning',
          confirmButtonText: 'Entendido'
        });
      } else if (!this.showEntrada && this.movementKardex.cantidadSalida) {
        const newStock = this.currentStock - this.movementKardex.cantidadSalida;
        Swal.fire({
          title: 'Stock por debajo del mínimo',
          text: `Esta salida llevará el stock por debajo del mínimo permitido (${this.selectedKardexType.minimumQuantity}). El stock resultante sería ${newStock}.`,
          icon: 'warning',
          confirmButtonText: 'Entendido'
        });
      }
    }
  }

  // Método para validar los límites de stock
  validateStockLimits(): boolean {
    if (!this.selectedKardexType) return true;

    const maxAmount = this.selectedKardexType.maximumAmount;
    const minAmount = this.selectedKardexType.minimumQuantity;
    
    // Para entradas, validamos que no se exceda el máximo
    if (this.showEntrada) {
      const newStock = this.currentStock + (this.movementKardex.cantidadEntrada || 0);
      if (newStock > maxAmount) {
        Swal.fire({
          title: 'Límite de stock excedido',
          text: `La cantidad ingresada excede el límite máximo permitido (${maxAmount}). El stock resultante sería ${newStock}.`,
          icon: 'warning',
          confirmButtonText: 'Entendido'
        });
        this.stockLimitsExceeded = true;
        return false;
      }
    } 
    // Para salidas, validamos que no se caiga por debajo del mínimo
    else {
      const newStock = this.currentStock - (this.movementKardex.cantidadSalida || 0);
      if (newStock < minAmount) {
        Swal.fire({
          title: 'Stock por debajo del mínimo',
          text: `Esta salida llevará el stock por debajo del mínimo permitido (${minAmount}). El stock resultante sería ${newStock}.`,
          icon: 'warning',
          confirmButtonText: 'Entendido'
        });
        this.stockLimitsExceeded = true;
        return false;
      }
    }
    
    this.stockLimitsExceeded = false;
    return true;
  }

  onSubmitModal(): void {
    if (!this.movementKardex) return;
    
    // Primero validamos los límites de stock
    if (!this.validateStockLimits()) return;
    
    this.proceedWithSubmit();
  }
  
  proceedWithSubmit(): void {
    if (this.isEdit && this.movementKardex.kardexId) {
      // Actualizamos el movimiento Kardex
      this.movementKardexService.update(this.movementKardex.kardexId, this.movementKardex).subscribe({
        next: (updatedMovement) => {
          Swal.fire('Actualizado', 'Movimiento de Kardex actualizado correctamente.', 'success');
          this.movementUpdated.emit(updatedMovement);
          this.closeModal.emit();
        },
        error: (err) => {
          console.error('Error al actualizar el movimiento de Kardex en el modal:', err);
          Swal.fire('Error', 'No se pudo actualizar el movimiento de Kardex.', 'error');
        }
      });
    } else {
      // Calcular el stock actualizado para incluirlo en el movimiento
      if (this.showEntrada) {
        this.movementKardex.cantidadSaldo = this.currentStock + (this.movementKardex.cantidadEntrada || 0);
        // Si no hay un costo unitario de saldo previo, usamos el de entrada
        if (!this.movementKardex.costoUnitarioSaldo) {
          this.movementKardex.costoUnitarioSaldo = this.movementKardex.costoUnitarioEntrada;
        }
        // Calculamos el valor total del saldo
        this.movementKardex.valorTotalSaldo = this.movementKardex.cantidadSaldo * (this.movementKardex.costoUnitarioSaldo || 0);
        
        // Limpiamos campos de salida
        this.movementKardex.cantidadSalida = 0;
        this.movementKardex.costoUnitarioSalida = 0;
        this.movementKardex.valorTotalSalida = 0;
        
        // Continuar con la creación del movimiento
        this.createNewMovement();
      } else {
        // Para salidas, necesitamos obtener el costo unitario del último movimiento
        this.movementKardexService.getAll().subscribe({
          next: (movements) => {
            // Calculamos el nuevo saldo
            this.movementKardex.cantidadSaldo = this.currentStock - (this.movementKardex.cantidadSalida || 0);
            
            // Filtramos y ordenamos los movimientos para encontrar el más reciente
            const lastMovements = movements
              .filter(m => m.typeKardexId === this.movementKardex.typeKardexId)
              .sort((a, b) => {
                const dateA = new Date(a.issueDate).getTime();
                const dateB = new Date(b.issueDate).getTime();
                if (dateA !== dateB) return dateB - dateA;
                return (b.kardexId || 0) - (a.kardexId || 0);
              });
            
            const lastMovement = lastMovements.length > 0 ? lastMovements[0] : null;
            
            // Usar el costo unitario del último movimiento para la salida
            if (lastMovement && lastMovement.costoUnitarioSaldo) {
              this.movementKardex.costoUnitarioSalida = this.movementKardex.costoUnitarioSalida || lastMovement.costoUnitarioSaldo;
              this.movementKardex.costoUnitarioSaldo = lastMovement.costoUnitarioSaldo;
            } else {
              this.movementKardex.costoUnitarioSalida = this.movementKardex.costoUnitarioSalida || 0;
              this.movementKardex.costoUnitarioSaldo = this.movementKardex.costoUnitarioSalida;
            }
            
            // Calculamos valores totales
            this.movementKardex.valorTotalSalida = (this.movementKardex.cantidadSalida || 0) * (this.movementKardex.costoUnitarioSalida || 0);
            this.movementKardex.valorTotalSaldo = (this.movementKardex.cantidadSaldo || 0) * (this.movementKardex.costoUnitarioSaldo || 0);
            
            // Limpiamos campos de entrada
            this.movementKardex.cantidadEntrada = 0;
            this.movementKardex.costoUnitarioEntrada = 0;
            this.movementKardex.valorTotalEntrada = 0;
            
            // Continuar con la creación del movimiento
            this.createNewMovement();
          },
          error: (err) => {
            console.error('Error al obtener movimientos para la salida:', err);
            Swal.fire('Error', 'No se pudo obtener información necesaria para registrar la salida.', 'error');
          }
        });
      }
    }
  }
  
  // Método separado para la creación del movimiento
  createNewMovement(): void {
    // Asegurarnos de que todos los campos numéricos son números y no null/undefined
    this.ensureValidNumericFields();
    
    console.log('Creando nuevo movimiento con datos:', this.movementKardex);
    
    const newMovement = { ...this.movementKardex };
    this.movementKardexService.create(newMovement).subscribe({
      next: (createdMovement) => {
        Swal.fire('Creado', 'Movimiento de Kardex creado correctamente.', 'success');
        this.movementUpdated.emit(createdMovement);
        this.closeModal.emit();
      },
      error: (err) => {
        console.error('Error al crear el movimiento de Kardex:', err);
        Swal.fire('Error', 'No se pudo crear el movimiento de Kardex.', 'error');
      }
    });
  }
  
  // Asegurar que todos los campos numéricos tienen valores válidos
  ensureValidNumericFields(): void {
    // Entrada
    this.movementKardex.cantidadEntrada = this.movementKardex.cantidadEntrada || 0;
    this.movementKardex.costoUnitarioEntrada = this.movementKardex.costoUnitarioEntrada || 0;
    this.movementKardex.valorTotalEntrada = this.movementKardex.valorTotalEntrada || 0;
    
    // Salida
    this.movementKardex.cantidadSalida = this.movementKardex.cantidadSalida || 0;
    this.movementKardex.costoUnitarioSalida = this.movementKardex.costoUnitarioSalida || 0;
    this.movementKardex.valorTotalSalida = this.movementKardex.valorTotalSalida || 0;
    
    // Saldo
    this.movementKardex.cantidadSaldo = this.movementKardex.cantidadSaldo || 0;
    this.movementKardex.costoUnitarioSaldo = this.movementKardex.costoUnitarioSaldo || 0;
    this.movementKardex.valorTotalSaldo = this.movementKardex.valorTotalSaldo || 0;
  }
  
  onCancelModal(): void {
    this.movementKardex = {} as MovementKardex;
    this.closeModal.emit();
  }

  toggleEntradaSalida(): void {
    this.showEntrada = !this.showEntrada;
    // Reiniciar la validación cuando cambiamos entre entrada y salida
    this.stockLimitsExceeded = false;
    // También podemos necesitar resetear algunos campos según el tipo
    if (this.showEntrada) {
      this.movementKardex.cantidadSalida = 0;
      this.movementKardex.costoUnitarioSalida = 0;
    } else {
      this.movementKardex.cantidadEntrada = 0;
      this.movementKardex.costoUnitarioEntrada = 0;
    }
  }
}

