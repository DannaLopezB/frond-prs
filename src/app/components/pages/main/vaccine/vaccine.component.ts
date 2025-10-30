import { Component, type OnInit } from "@angular/core"
import { CommonModule, registerLocaleData } from "@angular/common"
import { FormsModule } from "@angular/forms"
import type { Vaccine } from "../../../../../interfaces/Vaccine"
import { HttpClientModule } from "@angular/common/http"
import localeEs from "@angular/common/locales/es-PE"
import type { Details } from "../../../../../interfaces/VaccineDetail"



//Exportaciones:
import jsPDF from "jspdf"
import * as ExcelJS from "exceljs"
import { saveAs } from "file-saver"
import { ConfirmationConfig, ConfirmationModalComponent } from "./modal-vaccine/confirmation-modal.component"
import { VaccineService } from "../../../../../service/vaccine.service"
import { VaccineDetailService } from "../../../../../service/vaccineDetail.service"

registerLocaleData(localeEs) // Registra el locale

@Component({
  standalone: true,
  imports: [CommonModule, HttpClientModule, FormsModule, ConfirmationModalComponent],
  templateUrl: "./vaccine.component.html",
  styles: [],
})
export class VaccineComponent implements OnInit {
  isModalOpen = false
  vaccines: Vaccine[] = []
  filteredVaccines: Vaccine[] = []
  isLoading = true
  isActive = true
  isEditMode = false
  details: Details[] = []
  isDetailModalOpen = false
  selectedDetail: Details | null = null
  showFeedback = false // Para controlar la visibilidad del feedback
  feedbackMessage = "" // Mensaje de feedback
  paginatedVaccines: Vaccine[] = []
  pageSize = 10
  currentPage = 1
  activeActive = true
  activeFilter = "A"
  Math = Math // Esto expone Math al template

  // Filtros
  nameFilter = ""
  typeFilter = ""
  descriptionFilter = ""
  showExportDropdown = false

  // Información del proveedor
  editVaccine: Vaccine | null = null
  vaccineForm: Vaccine = { vaccineId: 0, nameVaccine: "", typeVaccine: "", description: "null", active: "A" }
  detailForm: Details = {
    vaccineId: undefined,
    amountMl: undefined,
    doseAmount: undefined,
    manufacturingDate: "",
    expirationDate: "",
    price: "",
    stock: "",
  }

  // Confirmation modal properties
  isConfirmationOpen = false
  confirmationConfig: ConfirmationConfig = {
    title: "",
    message: "",
    confirmText: "Confirmar",
    cancelText: "Cancelar",
    type: "info",
  }
  pendingAction: (() => void) | null = null

  constructor(
    private vaccineService: VaccineService,
    private vaccineDetailService: VaccineDetailService,
  ) {}

  ngOnInit(): void {
    this.getVaccines()
    this.loadDetails()
  }

  loadDetails(): void {
    this.vaccineDetailService.details$.subscribe({
      next: (data: Details[]) => {
        this.details = data // Asegúrate de que data sea del tipo Details[]
      },
      error: (err: any) => {
        console.error("Error fetching details:", err)
      },
    })
  }

  // Confirmation modal methods
  showConfirmation(config: ConfirmationConfig, action: () => void): void {
    this.confirmationConfig = config
    this.pendingAction = action
    this.isConfirmationOpen = true
  }

  onConfirmationConfirmed(): void {
    if (this.pendingAction) {
      this.pendingAction()
    }
    this.closeConfirmation()
  }

  onConfirmationCancelled(): void {
    this.closeConfirmation()
  }

  closeConfirmation(): void {
    this.isConfirmationOpen = false
    this.pendingAction = null
  }

  // Método para cerrar el feedback
  closeFeedback() {
    this.showFeedback = false
  }

  // Método para mostrar el feedback
  displayFeedback(message: string) {
    this.feedbackMessage = message
    this.showFeedback = true
  }

  getDetailForVaccine(vaccine: Vaccine): Details | null {
    return this.details.find((detail) => detail.vaccineId === vaccine.vaccineId) || null
  }

  getPages(): number[] {
    const totalPages = Math.ceil(this.vaccines.filter((s) => s.active === this.activeFilter).length / this.pageSize)
    return Array.from({ length: totalPages }, (_, i) => i + 1)
  }

  viewDetail(detail: Details): void {
    this.selectedDetail = detail
    this.isDetailModalOpen = true
  }

  closeDetailModal(): void {
    this.isDetailModalOpen = false
    this.selectedDetail = null
  }

  // Obtener todos los proveedores
  getVaccines(): void {
    this.vaccineService.vaccines$.subscribe({
      next: (data: Vaccine[]) => {
        this.vaccines = data
        this.filterVaccines()
        this.isLoading = false
      },
      error: (err: any) => {
        console.error("Error fetching vaccines:", err)
        this.isLoading = false
      },
    })
  }

filterVaccines(): void {
  this.filteredVaccines = this.vaccines.filter((vaccine) => {
    const matchesActive = vaccine.active === this.activeFilter;

    const matchesName = vaccine.nameVaccine
      .toLowerCase()
      .includes(this.nameFilter.toLowerCase());

    const matchesType = vaccine.typeVaccine
      .toLowerCase()
      .includes(this.typeFilter.toLowerCase());

    const matchesDescription = (vaccine.description ?? "")
      .toLowerCase()
      .includes(this.descriptionFilter.toLowerCase());

    return matchesActive && matchesName && matchesType && matchesDescription;
  });

  // Actualizar paginación después de filtrar
  this.currentPage = 1;
  this.applyActiveFilter();
}


  toggleActive(active: boolean): void {
    this.activeActive = active
    this.activeFilter = active ? "A" : "I"
    this.filterVaccines()
  }

  cambiarPagina(pagina: number): void {
    this.currentPage = pagina
    this.applyActiveFilter()
  }

  applyActiveFilter(): void {
    const filteredVaccines = this.vaccines.filter((vaccine) => vaccine.active === this.activeFilter)

    this.paginatedVaccines = filteredVaccines.slice(
      (this.currentPage - 1) * this.pageSize,
      this.currentPage * this.pageSize,
    )
  }

  // Activar un proveedor con confirmación
  confirmActivateVaccine(vaccine: Vaccine): void {
    const config: ConfirmationConfig = {
      title: "Confirmar Restauración",
      message: `¿Estás seguro de que deseas restaurar la vacuna "${vaccine.nameVaccine}"?`,
      confirmText: "Sí, Restaurar",
      cancelText: "Cancelar",
      type: "success",
    }

    this.showConfirmation(config, () => {
      this.activateVaccine(vaccine.vaccineId)
    })
  }

  // Activar un proveedor
  activateVaccine(id: number | undefined): void {
    if (id !== undefined) {
      this.vaccineService.activateVaccine(id).subscribe({
        next: () => {
          this.getVaccines()
          this.displayFeedback("Vacuna restaurada exitosamente.")
        },
        error: (err) => {
          console.error("Error activating vaccine:", err)
          this.displayFeedback("Error al restaurar la vacuna.")
        },
      })
    } else {
      console.error("Invalid vaccine ID")
    }
  }

  // Inactivar un proveedor con confirmación
  confirmInactivateVaccine(vaccine: Vaccine): void {
    const config: ConfirmationConfig = {
      title: "Confirmar Eliminación",
      message: `¿Estás seguro de que deseas eliminar la vacuna "${vaccine.nameVaccine}"? Esta acción se puede revertir posteriormente.`,
      confirmText: "Sí, Eliminar",
      cancelText: "Cancelar",
      type: "danger",
    }

    this.showConfirmation(config, () => {
      this.inactivateVaccine(vaccine.vaccineId)
    })
  }

  // Inactivar un proveedor
  inactivateVaccine(vaccineId: number | undefined): void {
    if (vaccineId !== undefined) {
      this.vaccineService.inactivateVaccine(vaccineId).subscribe({
        next: () => {
          this.getVaccines()
          this.displayFeedback("Vacuna eliminada exitosamente.")
        },
        error: (err) => {
          console.error("Error inactivating supplier:", err)
          this.displayFeedback("Error al eliminar la vacuna.")
        },
      })
    } else {
      console.error("Invalid supplier ID")
    }
  }

  // Abrir el modal en modo agregar
  openModal(): void {
    this.isEditMode = false
    this.vaccineForm = { vaccineId: 0, nameVaccine: "", typeVaccine: "", description: "", active: "A" }
    this.detailForm = {
      vaccineId: undefined,
      amountMl: undefined,
      doseAmount: undefined,
      manufacturingDate: "",
      expirationDate: "",
      price: "",
      stock: "",
    }
    this.isModalOpen = true
  }

  // Abrir el modal en modo edición
  editVaccineDetails(vaccine: Vaccine): void {
    this.isEditMode = true
    this.vaccineForm = { ...vaccine }
    const detail = this.getDetailForVaccine(vaccine)
    if (detail) {
      this.detailForm = { ...detail }
    }
    this.isModalOpen = true
  }

  // Cerrar el modal
  closeModal(): void {
    this.isModalOpen = false
  }

  // Confirmar agregar vacuna
  confirmAddVaccine(): void {
    const config: ConfirmationConfig = {
      title: "Confirmar Creación",
      message: `¿Estás seguro de que deseas agregar la vacuna "${this.vaccineForm.nameVaccine}"?`,
      confirmText: "Sí, Agregar",
      cancelText: "Cancelar",
      type: "success",
    }

    this.showConfirmation(config, () => {
      this.addVaccine()
    })
  }

// ADD
addVaccine(): void {
  // Normaliza vaccineId
  if (this.vaccineForm.vaccineId === 0) {
    this.vaccineForm.vaccineId = undefined;
  }

  // Normaliza description
  const desc = this.vaccineForm.description?.trim();
  this.vaccineForm.description = desc ? desc : null;

  // VALIDACIONES ===============================
  if (!this.detailForm.amountMl || this.detailForm.amountMl <= 0) {
    this.displayFeedback("La cantidad en mL debe ser mayor que 0.");
    return;
  }
  if (!this.detailForm.doseAmount || this.detailForm.doseAmount <= 0) {
    this.displayFeedback("El número de dosis debe ser mayor que 0.");
    return;
  }
if (!this.detailForm.stock || Number(this.detailForm.stock) <= 0) {
    this.displayFeedback("El stock debe ser mayor que 0.");
    return;
  }
  if (!this.isExpirationValid()) {
    this.displayFeedback("La fecha de expiración debe ser al menos un año después de la fecha de fabricación.");
    return;
  }
  // ============================================

  this.vaccineService.createVaccine(this.vaccineForm).subscribe({
    next: (newVaccine) => {
      this.detailForm.vaccineId = newVaccine.vaccineId;
      this.vaccineDetailService.createDetail(this.detailForm).subscribe(() => {
        this.getVaccines();
        this.closeModal();
        this.displayFeedback("Vacuna agregada exitosamente.");
      });
    },
    error: (err) => {
      console.error("Error adding vaccine:", err);
      this.displayFeedback("Error al agregar la vacuna.");
    },
  });
}


  // Confirmar actualizar vacuna
  confirmUpdateVaccine(): void {
    const config: ConfirmationConfig = {
      title: "Confirmar Actualización",
      message: `¿Estás seguro de que deseas actualizar la vacuna "${this.vaccineForm.nameVaccine}"?`,
      confirmText: "Sí, Actualizar",
      cancelText: "Cancelar",
      type: "warning",
    }

    this.showConfirmation(config, () => {
      this.updateVaccine()
    })
  }

  // UPDATE
updateVaccine(): void {
  if (!this.vaccineForm.vaccineId) {
    this.displayFeedback("Error: No se pudo encontrar el ID de la vacuna.");
    return;
  }

  // Normaliza description
  const desc = this.vaccineForm.description?.trim();
  this.vaccineForm.description = desc ? desc : null;

  // VALIDACIONES ===============================
  if (!this.detailForm.amountMl || this.detailForm.amountMl <= 0) {
    this.displayFeedback("La cantidad en mL debe ser mayor que 0.");
    return;
  }
  if (!this.detailForm.doseAmount || this.detailForm.doseAmount <= 0) {
    this.displayFeedback("El número de dosis debe ser mayor que 0.");
    return;
  }
if (!this.detailForm.stock || Number(this.detailForm.stock) <= 0) {
    this.displayFeedback("El stock debe ser mayor que 0.");
    return;
  }
  if (!this.isExpirationValid()) {
    this.displayFeedback("La fecha de expiración debe ser al menos un año después de la fecha de fabricación.");
    return;
  }
  // ============================================

  this.vaccineService.updateVaccine(this.vaccineForm.vaccineId, this.vaccineForm).subscribe({
    next: () => {
      if (this.detailForm.vaccineDetailId == null) {
        this.displayFeedback("Error: No se pudo encontrar el ID del detalle.");
        return;
      }

      this.vaccineDetailService.updateDetail(this.detailForm.vaccineDetailId, this.detailForm).subscribe({
        next: () => {
          this.getVaccines();
          this.closeModal();
          this.displayFeedback("Vacuna actualizada exitosamente.");
        },
        error: (err) => {
          console.error("Error updating detail:", err);
          this.displayFeedback("Error al actualizar los detalles de la vacuna.");
        },
      });
    },
    error: (err) => {
      console.error("Error updating vaccine:", err);
      this.displayFeedback("Error al actualizar la vacuna.");
    },
  });
}

isPriceValid(): boolean {
  return Number(this.detailForm.price) > 0;
}



  // Función auxiliar para validar fechas
  isValidDate(date: any): boolean {
    if (!date) return false

    const parsedDate = new Date(date)
    return !isNaN(parsedDate.getTime())
  }

  // Función auxiliar para obtener datos combinados para exportación
  getExportData(): any[] {
    return this.filteredVaccines.map((vaccine) => {
      const detail = this.getDetailForVaccine(vaccine)

      // Validar y limpiar las fechas antes de retornar
      const cleanDetail = detail
        ? {
            ...detail,
            manufacturingDate: this.isValidDate(detail.manufacturingDate) ? detail.manufacturingDate : null,
            expirationDate: this.isValidDate(detail.expirationDate) ? detail.expirationDate : null,
          }
        : {}

      return {
        vaccine: vaccine,
        detail: cleanDetail,
      }
    })
  }

  getDaysUntilExpiration(expirationDate: string | Date | null | undefined): number {
    if (!expirationDate || !this.isValidDate(expirationDate)) {
      return -999 // Valor que indica fecha inválida
    }

    try {
      const expDate = new Date(expirationDate)
      const today = new Date()
      const timeDiff = expDate.getTime() - today.getTime()
      return Math.ceil(timeDiff / (1000 * 3600 * 24))
    } catch (error) {
      console.error("Error al calcular días hasta expiración:", error)
      return -999
    }
  }

  getExpirationStatusClass(expirationDate: string | Date | null | undefined): string {
    const daysLeft = this.getDaysUntilExpiration(expirationDate)

    if (daysLeft === -999) {
      return "text-gray-400" // Fecha inválida
    } else if (daysLeft < 0) {
      return "text-red-600 font-bold" // Expirado
    } else if (daysLeft < 30) {
      return "text-amber-600 font-bold" // Próximo a expirar
    } else {
      return "text-green-600" // Vigente
    }
  }

  downloadCSV(): void {
    const dataToExport = this.getExportData()

    if (dataToExport.length === 0) {
      this.displayFeedback("No hay datos para exportar con los filtros aplicados.")
      return
    }

    const headers = [
      "Nombre de Vacuna",
      "Tipo de Vacuna",
      "Descripción",
      "Estado",
      "Cantidad (ml)",
      "Cantidad de Dosis",
      "Fecha de Fabricación",
      "Fecha de Expiración",
      "Precio",
      "Stock",
    ]

    const csvData = dataToExport.map((item) => {
      const vaccine = item.vaccine
      const detail = item.detail

      return [
        `"${vaccine.nameVaccine || "N/A"}"`,
        `"${vaccine.typeVaccine || "N/A"}"`,
        `"${vaccine.description || "N/A"}"`,
        `"${vaccine.active === "A" ? "Activo" : "Inactivo"}"`,
        `"${detail.amountMl || 0}"`,
        `"${detail.doseAmount || 0}"`,
        `"${this.formatDate(detail.manufacturingDate) || "N/A"}"`,
        `"${this.formatDate(detail.expirationDate) || "N/A"}"`,
        `"S/${detail.price || 0}"`,
        `"${detail.stock || "N/A"}"`,
      ].join(",")
    })

    const BOM = "\uFEFF"
    const csvContent = BOM + [headers.map((h) => `"${h}"`).join(","), ...csvData].join("\n")
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8" })
    saveAs(blob, "aplicacion_vacunas.csv")

    this.displayFeedback("Archivo CSV descargado exitosamente.")
  }

  formatDate(date: string | Date | null | undefined): string {
    // Verificar si la fecha es null, undefined o vacía
    if (!date) {
      return "N/A"
    }

    let parsedDate: Date

    try {
      // Si es string, intentar parsearlo
      if (typeof date === "string") {
        // Manejar diferentes formatos de fecha
        if (date.trim() === "") {
          return "N/A"
        }

        // Crear la fecha
        parsedDate = new Date(date)
      } else {
        // Si ya es Date, usarlo directamente
        parsedDate = date
      }

      // Verificar si la fecha es válida
      if (isNaN(parsedDate.getTime())) {
        console.warn("Fecha inválida:", date)
        return "N/A"
      }

      // Formatear la fecha
      const day = parsedDate.getDate()
      const monthNames = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"]
      const month = monthNames[parsedDate.getMonth()]
      const year = parsedDate.getFullYear()
      return `${day.toString().padStart(2, "0")}-${month}-${year}`
    } catch (error) {
      console.error("Error al formatear fecha:", error, "Fecha original:", date)
      return "N/A"
    }
  }

  // Función del dropdown (sin cambios)
  toggleExportDropdown(event: Event): void {
    event.stopPropagation()
    this.showExportDropdown = !this.showExportDropdown
    if (this.showExportDropdown) {
      setTimeout(() => {
        const closeDropdown = () => {
          this.showExportDropdown = false
          document.removeEventListener("click", closeDropdown)
        }
        document.addEventListener("click", closeDropdown)
      }, 0)
    }
  }

  downloadExcel(): void {
    const dataToExport = this.getExportData()

    if (dataToExport.length === 0) {
      this.displayFeedback("No hay datos para exportar con los filtros aplicados.")
      return
    }

    const workbook = new ExcelJS.Workbook()
    const worksheet = workbook.addWorksheet("Registro de Vacunas")

    worksheet.columns = [
      { header: "Nombre de Vacuna", key: "nombreVacuna", width: 25 },
      { header: "Tipo de Vacuna", key: "tipoVacuna", width: 20 },
      { header: "Descripción", key: "descripcion", width: 30 },
      { header: "Estado", key: "estado", width: 12 },
      { header: "Cantidad (ml)", key: "cantidadMl", width: 15 },
      { header: "Cantidad de Dosis", key: "cantidadDosis", width: 18 },
      { header: "Fecha de Fabricación", key: "fechaFabricacion", width: 18 },
      { header: "Fecha de Expiración", key: "fechaExpiracion", width: 18 },
      { header: "Precio", key: "precio", width: 15 },
      { header: "Stock", key: "stock", width: 15 },
    ]

    const headerRow = worksheet.getRow(1)
    headerRow.font = { bold: true, color: { argb: "FFFFFF" } }
    headerRow.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "4F81BD" },
    }
    headerRow.alignment = { horizontal: "center", vertical: "middle" }
    headerRow.height = 20

    dataToExport.forEach((item) => {
      const vaccine = item.vaccine
      const detail = item.detail

      worksheet.addRow({
        nombreVacuna: vaccine.nameVaccine || "N/A",
        tipoVacuna: vaccine.typeVaccine || "N/A",
        descripcion: vaccine.description || "N/A",
        estado: vaccine.active === "A" ? "Activo" : "Inactivo",
        cantidadMl: detail.amountMl || 0,
        cantidadDosis: detail.doseAmount || 0,
        fechaFabricacion: this.formatDate(detail.manufacturingDate) || "N/A",
        fechaExpiracion: this.formatDate(detail.expirationDate) || "N/A",
        precio: detail.price || "0",
        stock: detail.stock || "N/A",
      })
    })

    workbook.xlsx
      .writeBuffer()
      .then((buffer) => {
        const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" })
        saveAs(blob, "aplicacion_vacunas.xlsx")
        this.displayFeedback("Archivo Excel descargado exitosamente.")
      })
      .catch((error) => {
        console.error("Error al generar Excel:", error)
        this.displayFeedback("Error al generar el archivo Excel.")
      })
  }

  downloadPDF(): void {
    const dataToExport = this.getExportData()

    if (dataToExport.length === 0) {
      this.displayFeedback("No hay datos para exportar con los filtros aplicados.")
      return
    }

    const doc = new jsPDF("l", "mm", "a4")
    doc.setFontSize(20)
    doc.setFont("helvetica", "bold")
    doc.text("Lista de Vacunas", 20, 20)

    doc.setFontSize(12)
    doc.setFont("helvetica", "normal")
    doc.text(`Estado: ${this.activeFilter === "A" ? "Activos" : "Inactivos"}`, 20, 35)

    const today = new Date()
    doc.text(`Generado el: ${today.toLocaleDateString()} a las ${today.toLocaleTimeString()}`, 20, 45)

    doc.setLineWidth(0.5)
    doc.line(20, 50, 277, 50)

    const tableColumn = [
      "Nombre de Vacuna",
      "Tipo de Vacuna",
      "Descripción",
      "Estado",
      "Cantidad (ml)",
      "Cantidad de Dosis",
      "Fecha de Fabricación",
      "Fecha de Expiración",
      "Precio",
      "Stock",
    ]

    const tableRows = dataToExport.map((item) => {
      const vaccine = item.vaccine
      const detail = item.detail

      return [
        vaccine.nameVaccine || "N/A",
        vaccine.typeVaccine || "N/A",
        vaccine.description || "N/A",
        vaccine.active === "A" ? "Activo" : "Inactivo",
        detail.amountMl?.toString() || "0",
        detail.doseAmount?.toString() || "0",
        this.formatDate(detail.manufacturingDate) || "N/A",
        this.formatDate(detail.expirationDate) || "N/A",
        `S/${detail.price || "0"}`,
        detail.stock || "N/A",
      ]
    })

    import("jspdf-autotable")
      .then((x) => {
        const autoTable = (x as any).default || x
        autoTable(doc, {
          startY: 55,
          head: [tableColumn],
          body: tableRows,
          theme: "striped",
          styles: {
            fontSize: 9,
            cellPadding: 3,
            overflow: "linebreak",
            halign: "center",
          },
          headStyles: {
            fillColor: [0, 123, 255],
            textColor: [255, 255, 255],
            fontStyle: "bold",
            fontSize: 10,
          },
          alternateRowStyles: {
            fillColor: [245, 245, 245],
          },
          columnStyles: {
            0: { cellWidth: 25 }, // Nombre de Vacuna
            1: { cellWidth: 30 }, // Tipo de Vacuna
            2: { cellWidth: 25 }, // Descripción
            3: { cellWidth: 18 }, // Estado
            4: { cellWidth: 25 }, // Cantidad (ml)
            5: { cellWidth: 25 }, // Cantidad de Dosis
            6: { cellWidth: 30 }, // Fecha de Fabricación
            7: { cellWidth: 30 }, // Fecha de Expiración
            8: { cellWidth: 20 }, // Precio
            9: { cellWidth: 20 }, // Stock
          },
        })
        doc.save("vacunas.pdf")
        this.displayFeedback("Archivo PDF descargado exitosamente.")
      })
      .catch((err) => {
        console.error("Error al cargar jspdf-autotable", err)

        // Fallback manual
        let y = 60
        doc.setFontSize(8)
        doc.setFont("helvetica", "bold")
        tableColumn.forEach((header, i) => {
          doc.text(header, 20 + i * 30, y)
        })
        doc.setFont("helvetica", "normal")
        y += 10
        tableRows.forEach((row) => {
          row.forEach((cell: string, i: number) => {
            doc.text(cell, 20 + i * 30, y)
          })
          y += 8

          if (y > 190) {
            doc.addPage()
            y = 20
            doc.setFont("helvetica", "bold")
            tableColumn.forEach((header, i) => {
              doc.text(header, 20 + i * 30, y)
            })
            doc.setFont("helvetica", "normal")
            y += 10
          }
        })
        doc.save("vacunas.pdf")
        this.displayFeedback("Archivo PDF descargado exitosamente.")
      })
  }

  // Función de debug para verificar datos (temporal)
  debugExportData(): void {
    console.log("=== DEBUG EXPORT DATA ===")
    console.log("Vaccines total:", this.vaccines.length)
    console.log("Details total:", this.details.length)
    console.log("Filtered vaccines:", this.filteredVaccines.length)

    const exportData = this.getExportData()
    console.log("Export data:", exportData)

    // Verificar fechas específicamente
    exportData.forEach((item, index) => {
      console.log(`Item ${index}:`, {
        vaccine: item.vaccine.nameVaccine,
        manufacturingDate: item.detail.manufacturingDate,
        expirationDate: item.detail.expirationDate,
        formattedManufacturing: this.formatDate(item.detail.manufacturingDate),
        formattedExpiration: this.formatDate(item.detail.expirationDate),
      })
    })
  }

  isExpirationValid(): boolean {
  if (!this.detailForm.manufacturingDate || !this.detailForm.expirationDate) return true

  const manufacturing = new Date(this.detailForm.manufacturingDate)
  const expiration = new Date(this.detailForm.expirationDate)

  const oneYearLater = new Date(manufacturing)
  oneYearLater.setFullYear(manufacturing.getFullYear() + 1)

  return expiration >= oneYearLater
}

}
