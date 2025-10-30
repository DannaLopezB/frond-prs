import { Component, Input, Output, EventEmitter } from "@angular/core"
import { CommonModule } from "@angular/common"

export interface ConfirmationConfig {
  title: string
  message: string
  confirmText: string
  cancelText: string
  type: "success" | "warning" | "danger" | "info"
}

@Component({
  selector: "app-confirmation-modal",
  standalone: true,
  imports: [CommonModule],
  template: `
    <!-- Modal Overlay -->
    <div *ngIf="isOpen" 
         class="fixed inset-0 z-50 overflow-y-auto"
         [class.animate-in]="isOpen"
         [class.fade-in]="isOpen"
         [class.duration-200]="isOpen"
         aria-labelledby="modal-title" 
         role="dialog" 
         aria-modal="true">
      
      <!-- Background overlay with blur effect -->
      <div class="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div class="fixed inset-0 bg-gray-900/75 backdrop-blur-sm transition-opacity duration-300 ease-out" 
             [class.opacity-100]="isOpen"
             [class.opacity-0]="!isOpen"
             aria-hidden="true" 
             (click)="onCancel()"></div>

        <!-- Center modal -->
        <span class="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
        
        <!-- Modal panel with enhanced styling -->
        <div class="relative inline-block align-bottom bg-white rounded-2xl px-4 pt-5 pb-4 text-left overflow-hidden shadow-2xl transform transition-all duration-300 ease-out sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-0"
             [class.scale-100]="isOpen"
             [class.scale-95]="!isOpen"
             [class.opacity-100]="isOpen"
             [class.opacity-0]="!isOpen">
          
          <!-- Decorative top border -->
          <div class="absolute top-0 left-0 right-0 h-1 rounded-t-2xl" [ngClass]="getTopBorderClasses()"></div>
          
          <div class="sm:flex sm:items-start sm:p-6">
            <!-- Enhanced Icon with gradient background -->
            <div class="mx-auto flex-shrink-0 flex items-center justify-center h-16 w-16 rounded-2xl sm:mx-0 sm:h-12 sm:w-12 relative overflow-hidden"
                 [ngClass]="getIconBackgroundClasses()">
              <!-- Gradient overlay -->
              <div class="absolute inset-0 opacity-10" [ngClass]="getGradientOverlayClasses()"></div>
              
              <!-- Icon with enhanced styling -->
              <div class="relative z-10 p-2">
                <svg class="h-8 w-8 sm:h-6 sm:w-6" [ngClass]="getIconColorClasses()" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <!-- Success icon -->
                  <path *ngIf="config.type === 'success'" stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  <!-- Warning icon -->
                  <path *ngIf="config.type === 'warning'" stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  <!-- Danger icon -->
                  <path *ngIf="config.type === 'danger'" stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  <!-- Info icon -->
                  <path *ngIf="config.type === 'info'" stroke-linecap="round" stroke-linejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            
            <!-- Enhanced Content -->
            <div class="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left flex-1">
              <h3 class="text-xl leading-6 font-bold text-gray-900 mb-2" id="modal-title">
                {{ config.title }}
              </h3>
              <div class="mt-2">
                <p class="text-sm text-gray-600 leading-relaxed">
                  {{ config.message }}
                </p>
              </div>
            </div>
          </div>
          
          <!-- Enhanced Action buttons -->
          <div class="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse sm:gap-3 rounded-b-2xl mt-5 sm:mt-4">
            <!-- Confirm button with enhanced styling -->
            <button type="button" 
                    class="w-full inline-flex justify-center items-center gap-2 rounded-xl border border-transparent shadow-sm px-6 py-3 text-base font-semibold text-white focus:outline-none focus:ring-2 focus:ring-offset-2 sm:ml-3 sm:w-auto sm:text-sm transition-all duration-200 transform hover:scale-105 active:scale-95"
                    [ngClass]="getConfirmButtonClasses()"
                    (click)="onConfirm()">
              <!-- Icon for confirm button -->
              <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path *ngIf="config.type === 'success'" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                <path *ngIf="config.type === 'warning'" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01" />
                <path *ngIf="config.type === 'danger'" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                <path *ngIf="config.type === 'info'" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01" />
              </svg>
              {{ config.confirmText }}
            </button>
            
            <!-- Cancel button with enhanced styling -->
            <button type="button" 
                    class="mt-3 w-full inline-flex justify-center items-center gap-2 rounded-xl border border-gray-300 shadow-sm px-6 py-3 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 sm:mt-0 sm:w-auto sm:text-sm transition-all duration-200 hover:border-gray-400"
                    (click)="onCancel()">
              <!-- Cancel icon -->
              <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
              {{ config.cancelText }}
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class ConfirmationModalComponent {
  @Input() isOpen = false
  @Input() config: ConfirmationConfig = {
    title: "Confirmar acción",
    message: "¿Estás seguro de que deseas continuar?",
    confirmText: "Confirmar",
    cancelText: "Cancelar",
    type: "info",
  }

  @Output() confirmed = new EventEmitter<void>()
  @Output() cancelled = new EventEmitter<void>()

  onConfirm(): void {
    this.confirmed.emit()
  }

  onCancel(): void {
    this.cancelled.emit()
  }

  getTopBorderClasses(): string {
    switch (this.config.type) {
      case "success":
        return "bg-gradient-to-r from-green-400 to-emerald-500"
      case "warning":
        return "bg-gradient-to-r from-yellow-400 to-orange-500"
      case "danger":
        return "bg-gradient-to-r from-red-400 to-rose-500"
      case "info":
      default:
        return "bg-gradient-to-r from-blue-400 to-indigo-500"
    }
  }

  getIconBackgroundClasses(): string {
    switch (this.config.type) {
      case "success":
        return "bg-gradient-to-br from-green-50 to-emerald-100 border-2 border-green-200"
      case "warning":
        return "bg-gradient-to-br from-yellow-50 to-orange-100 border-2 border-yellow-200"
      case "danger":
        return "bg-gradient-to-br from-red-50 to-rose-100 border-2 border-red-200"
      case "info":
      default:
        return "bg-gradient-to-br from-blue-50 to-indigo-100 border-2 border-blue-200"
    }
  }

  getGradientOverlayClasses(): string {
    switch (this.config.type) {
      case "success":
        return "bg-gradient-to-br from-green-400 to-emerald-600"
      case "warning":
        return "bg-gradient-to-br from-yellow-400 to-orange-600"
      case "danger":
        return "bg-gradient-to-br from-red-400 to-rose-600"
      case "info":
      default:
        return "bg-gradient-to-br from-blue-400 to-indigo-600"
    }
  }

  getIconColorClasses(): string {
    switch (this.config.type) {
      case "success":
        return "text-green-600"
      case "warning":
        return "text-yellow-600"
      case "danger":
        return "text-red-600"
      case "info":
      default:
        return "text-blue-600"
    }
  }

  getConfirmButtonClasses(): string {
    switch (this.config.type) {
      case "success":
        return "bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 focus:ring-green-500 shadow-green-200"
      case "warning":
        return "bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-700 hover:to-orange-700 focus:ring-yellow-500 shadow-yellow-200"
      case "danger":
        return "bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 focus:ring-red-500 shadow-red-200"
      case "info":
      default:
        return "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 focus:ring-blue-500 shadow-blue-200"
    }
  }
}
