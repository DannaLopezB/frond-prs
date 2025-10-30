import { User } from '../../../../interfaces/User';
import { AuthService } from './../../../auth/service/auth.services';
import { UserService } from './../../../../service/user.service';
import { Component, OnInit, OnDestroy } from "@angular/core"
import { CommonModule } from "@angular/common"
import { RouterModule } from "@angular/router"
import { FormsModule } from "@angular/forms"
import { UserModalComponent } from "./user-modal/user-modal.component"
import { Subject, takeUntil, finalize, debounceTime, distinctUntilChanged } from "rxjs"
import Swal from "sweetalert2"

@Component({
    selector: "app-users",
    templateUrl: "./users.component.html",
    standalone: true,
    imports: [CommonModule, RouterModule, FormsModule, UserModalComponent],
    styleUrls: ["./users.component.css"],
})
export class UsersComponent implements OnInit, OnDestroy {
    users: User[] = []
    filteredUsers: User[] = []
    isLoading = true
    hasError = false
    error = ""
    isProcessing = false

    // Modal y formulario
    isFormVisible = false
    isEditing = false
    selectedUser: User | null = null

    // User details modal
    showUserDetails = false
    selectedUserDetails: User | null = null

    // Búsqueda mejorada
    searchTerm = ""
    private searchSubject = new Subject<string>()

    // Filtros
    selectedRoleFilter: 'ALL' | 'ADMIN' | 'USER' = 'ALL'

    // Permisos
    isAdmin = false

    // Para cleanup de subscripciones
    private destroy$ = new Subject<void>()

    constructor(
        private userService: UserService,
        private authService: AuthService,
    ) { }

    ngOnInit(): void {
        this.checkUserPermissions()
        this.setupSearch()
        this.loadUsers()
    }

    ngOnDestroy(): void {
        this.destroy$.next()
        this.destroy$.complete()
    }

    /**
     * 📊 Métodos para contar usuarios por rol
     */
    getTotalCount(): number {
        return this.users.length
    }

    getAdminCount(): number {
        return this.users.filter(user => user.role[0] === 'ADMIN').length
    }

    getUserCount(): number {
        return this.users.filter(user => user.role[0] === 'USER').length
    }

    /**
     * 🎯 Métodos de interactividad
     */
    onSearchFocus(): void {
        console.log('🔍 Búsqueda activada')
    }

    onSearchBlur(): void {
        console.log('🔍 Búsqueda desactivada')
    }

    onButtonHover(): void {
        console.log('🖱️ Hover en botón')
    }

    clearSearch(): void {
        this.searchTerm = ''
        this.onSearch('')
    }

    /**
     * 👁️ Ver detalles del usuario
     */
    viewUserDetails(user: User): void {
        this.selectedUserDetails = user
        this.showUserDetails = true
        console.log('👁️ Viendo detalles de:', user.name)
    }

    closeUserDetails(): void {
        this.showUserDetails = false
        this.selectedUserDetails = null
    }

    /**
     * 🔍 Configurar búsqueda con debounce
     */
    private setupSearch(): void {
        this.searchSubject
            .pipe(
                debounceTime(300),
                distinctUntilChanged(),
                takeUntil(this.destroy$)
            )
            .subscribe(term => {
                this.performSearch(term)
            })
    }

    /**
     * 🔐 Verificar permisos del usuario
     */
    checkUserPermissions(): void {
        this.isAdmin = this.authService.isAdminSync()
        console.log("👤 Permisos del usuario - Es Admin:", this.isAdmin)
    }

    /**
     * 📋 Cargar lista de usuarios desde el backend
     */
    loadUsers(): void {
        this.isLoading = true
        this.hasError = false
        this.error = ""

        this.userService
            .getAllUsers()
            .pipe(
                takeUntil(this.destroy$),
                finalize(() => (this.isLoading = false)),
            )
            .subscribe({
                next: (users) => {
                    console.log("✅ Usuarios cargados:", users)
                    this.users = users
                    this.applyFilters()
                    
                    // Mostrar notificación de éxito
                    if (users.length > 0) {
                        this.showSuccessToast(`${users.length} usuarios cargados exitosamente`)
                    }
                },
                error: (error) => {
                    console.error("❌ Error al cargar usuarios:", error)
                    this.hasError = true
                    this.error = "Error al cargar los usuarios. Por favor, intente nuevamente."

                    Swal.fire({
                        icon: "error",
                        title: "Error al cargar usuarios",
                        text: "No se pudieron cargar los usuarios. Verifique su conexión.",
                        confirmButtonText: "Reintentar",
                        confirmButtonColor: "#3b82f6",
                        showCancelButton: true,
                        cancelButtonText: "Cancelar"
                    }).then((result) => {
                        if (result.isConfirmed) {
                            this.loadUsers()
                        }
                    })
                },
            })
    }

    /**
     * 🔍 Manejar cambios en la búsqueda
     */
    onSearch(term: string): void {
        this.searchSubject.next(term)
    }

    /**
     * 🔍 Realizar búsqueda
     */
    private performSearch(term: string): void {
        this.searchTerm = term.toLowerCase()
        this.applyFilters()
    }

    /**
     * 🏷️ Filtrar por rol
     */
    filterByRole(role: 'ALL' | 'ADMIN' | 'USER'): void {
        this.selectedRoleFilter = role
        this.applyFilters()
        
        // Feedback visual
        let message = ''
        switch(role) {
            case 'ALL':
                message = `Mostrando todos los usuarios (${this.filteredUsers.length})`
                break
            case 'ADMIN':
                message = `Mostrando administradores (${this.filteredUsers.length})`
                break
            case 'USER':
                message = `Mostrando usuarios (${this.filteredUsers.length})`
                break
        }
        this.showInfoToast(message)
    }

    /**
     * 🔧 Aplicar todos los filtros
     */
    private applyFilters(): void {
        let filtered = [...this.users]

        // Filtro por rol
        if (this.selectedRoleFilter !== 'ALL') {
            filtered = filtered.filter(user => user.role[0] === this.selectedRoleFilter)
        }

        // Filtro por búsqueda
        if (this.searchTerm.trim()) {
            filtered = filtered.filter(user =>
                user.name.toLowerCase().includes(this.searchTerm) ||
                user.lastName.toLowerCase().includes(this.searchTerm) ||
                user.email.toLowerCase().includes(this.searchTerm) ||
                user.documentNumber.includes(this.searchTerm) ||
                user.cellPhone.includes(this.searchTerm)
            )
        }

        this.filteredUsers = filtered
    }

    /**
     * 🆔 TrackBy function para mejor rendimiento
     */
    trackByUserId(index: number, user: User): number {
        return user.id || index
    }

    /**
     * ➕ Abrir formulario para crear nuevo usuario
     */
    openForm(user?: User): void {
        if (!this.isAdmin) {
            Swal.fire({
                icon: "warning",
                title: "Sin permisos",
                text: "No tiene permisos para realizar esta acción.",
                confirmButtonText: "Entendido",
                confirmButtonColor: "#3b82f6",
            })
            return
        }

        this.isFormVisible = true
        this.isEditing = !!user

        if (user) {
            // Modo edición - clonar el usuario para evitar mutaciones
            this.selectedUser = { ...user }
            console.log("✏️ Editando usuario:", this.selectedUser)
            this.showInfoToast(`Editando usuario: ${user.name} ${user.lastName}`)
        } else {
            // Modo creación - usuario vacío
            this.selectedUser = {
                name: "",
                lastName: "",
                documentType: "DNI",
                documentNumber: "",
                cellPhone: "",
                email: "",
                password: "",
                role: ["USER"],
                profileImage: "",
            }
            console.log("➕ Creando nuevo usuario")
            this.showInfoToast("Creando nuevo usuario")
        }
    }

    /**
     * ❌ Cerrar formulario
     */
    closeForm(): void {
        this.isFormVisible = false
        this.isEditing = false
        this.selectedUser = null
    }

    /**
     * 💾 Guardar usuario (crear o actualizar)
     */
    saveUser(userData: User): void {
        if (!this.isAdmin) {
            Swal.fire({
                icon: "warning",
                title: "Sin permisos",
                text: "No tiene permisos para realizar esta acción.",
                confirmButtonText: "Entendido",
                confirmButtonColor: "#3b82f6",
            })
            return
        }

        this.isProcessing = true
        console.log("💾 Guardando usuario:", userData)

        // Mostrar loading con diseño mejorado
        Swal.fire({
            title: this.isEditing ? "Actualizando usuario..." : "Creando usuario...",
            html: `
                <div class="flex flex-col items-center gap-4">
                    <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                    <p class="text-gray-600">Por favor espere mientras procesamos la información</p>
                </div>
            `,
            allowOutsideClick: false,
            showConfirmButton: false,
        })

        // Preparar archivo si hay imagen en base64
        let imageFile: File | null = null
        if (userData.profileImage && userData.profileImage.startsWith("data:image/")) {
            imageFile = this.base64ToFile(userData.profileImage, "profile-image.jpg")
        }

        const operation = this.isEditing
            ? this.userService.updateUser(userData, imageFile)
            : this.userService.createUser(userData, imageFile)

        operation.pipe(
            takeUntil(this.destroy$),
            finalize(() => this.isProcessing = false)
        ).subscribe({
            next: (savedUser) => {
                console.log("✅ Usuario guardado exitosamente:", savedUser)

                Swal.fire({
                    icon: "success",
                    title: this.isEditing ? "¡Usuario actualizado!" : "¡Usuario creado!",
                    html: `
                        <div class="text-center">
                            <p class="text-lg font-semibold text-gray-800 mb-2">
                                ${savedUser.name} ${savedUser.lastName}
                            </p>
                            <p class="text-gray-600">
                                Ha sido ${this.isEditing ? "actualizado" : "creado"} exitosamente
                            </p>
                        </div>
                    `,
                    timer: 3000,
                    showConfirmButton: false,
                    toast: true,
                    position: 'top-end',
                })

                // Actualizar la lista local
                if (this.isEditing) {
                    const index = this.users.findIndex((u) => u.id === savedUser.id)
                    if (index !== -1) {
                        this.users[index] = savedUser
                    }
                } else {
                    this.users.unshift(savedUser)
                }

                // Aplicar filtros actuales
                this.applyFilters()

                // Cerrar formulario
                this.closeForm()
            },
            error: (error) => {
                console.error("❌ Error al guardar usuario:", error)

                Swal.fire({
                    icon: "error",
                    title: "Error al guardar",
                    html: `
                        <div class="text-center">
                            <p class="text-gray-800 mb-2">No se pudo guardar el usuario</p>
                            <p class="text-sm text-gray-600">${error.message || 'Intente nuevamente'}</p>
                        </div>
                    `,
                    confirmButtonText: "Entendido",
                    confirmButtonColor: "#3b82f6",
                })
            },
        })
    }

    /**
     * 🗑️ Eliminar usuario con confirmación mejorada
     */
    deleteUser(userId: number): void {
        if (!this.isAdmin) {
            Swal.fire({
                icon: "warning",
                title: "Sin permisos",
                text: "No tiene permisos para realizar esta acción.",
                confirmButtonText: "Entendido",
                confirmButtonColor: "#3b82f6",
            })
            return
        }

        const user = this.users.find((u) => u.id === userId)
        if (!user) return

        Swal.fire({
            title: "¿Eliminar usuario?",
            html: `
                <div class="text-center">
                    <div class="mb-4">
                        <img src="${user.profileImage || 'https://ui-avatars.com/api/?name=' + user.name + '+' + user.lastName + '&background=dc2626&color=fff&size=80'}" 
                             alt="${user.name} ${user.lastName}"
                             class="w-16 h-16 rounded-full mx-auto mb-2 ring-2 ring-red-200">
                        <p class="text-lg font-semibold text-gray-800">${user.name} ${user.lastName}</p>
                        <p class="text-sm text-gray-600">${user.email}</p>
                    </div>
                    <p class="text-red-600 font-medium">Esta acción no se puede deshacer</p>
                </div>
            `,
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#dc2626",
            cancelButtonColor: "#6b7280",
            confirmButtonText: "Sí, eliminar",
            cancelButtonText: "Cancelar",
            reverseButtons: true,
        }).then((result) => {
            if (result.isConfirmed) {
                this.isProcessing = true
                
                // Mostrar loading
                Swal.fire({
                    title: "Eliminando usuario...",
                    html: `
                        <div class="flex flex-col items-center gap-4">
                            <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
                            <p class="text-gray-600">Eliminando ${user.name} ${user.lastName}</p>
                        </div>
                    `,
                    allowOutsideClick: false,
                    showConfirmButton: false,
                })

                this.userService
                    .deleteUser(userId)
                    .pipe(
                        takeUntil(this.destroy$),
                        finalize(() => this.isProcessing = false)
                    )
                    .subscribe({
                        next: () => {
                            console.log("✅ Usuario eliminado exitosamente")

                            Swal.fire({
                                icon: "success",
                                title: "¡Usuario eliminado!",
                                html: `
                                    <div class="text-center">
                                        <p class="text-lg font-semibold text-gray-800 mb-2">
                                            ${user.name} ${user.lastName}
                                        </p>
                                        <p class="text-gray-600">
                                            Ha sido eliminado exitosamente
                                        </p>
                                    </div>
                                `,
                                timer: 3000,
                                showConfirmButton: false,
                                toast: true,
                                position: 'top-end',
                            })

                            // Remover de la lista local
                            this.users = this.users.filter((u) => u.id !== userId)
                            this.applyFilters()
                        },
                        error: (error) => {
                            console.error("❌ Error al eliminar usuario:", error)

                            Swal.fire({
                                icon: "error",
                                title: "Error al eliminar",
                                html: `
                                    <div class="text-center">
                                        <p class="text-gray-800 mb-2">No se pudo eliminar el usuario</p>
                                        <p class="text-sm text-gray-600">${error.message || 'Intente nuevamente'}</p>
                                    </div>
                                `,
                                confirmButtonText: "Entendido",
                                confirmButtonColor: "#3b82f6",
                            })
                        },
                    })
            }
        })
    }

    /**
     * 🔄 Recargar lista de usuarios
     */
    refreshUsers(): void {
        this.showInfoToast("Recargando usuarios...")
        this.loadUsers()
    }

    /**
     * 🎉 Mostrar notificaciones toast
     */
    private showSuccessToast(message: string): void {
        Swal.fire({
            icon: 'success',
            title: message,
            toast: true,
            position: 'top-end',
            showConfirmButton: false,
            timer: 3000,
            timerProgressBar: true,
        })
    }

    private showInfoToast(message: string): void {
        Swal.fire({
            icon: 'info',
            title: message,
            toast: true,
            position: 'top-end',
            showConfirmButton: false,
            timer: 2000,
            timerProgressBar: true,
        })
    }

    private showErrorToast(message: string): void {
        Swal.fire({
            icon: 'error',
            title: message,
            toast: true,
            position: 'top-end',
            showConfirmButton: false,
            timer: 4000,
            timerProgressBar: true,
        })
    }

    /**
     * 🖼️ Convertir base64 a File para envío al backend
     */
    private base64ToFile(base64String: string, filename: string): File {
        const arr = base64String.split(",")
        const mime = arr[0].match(/:(.*?);/)![1]
        const bstr = atob(arr[1])
        let n = bstr.length
        const u8arr = new Uint8Array(n)

        while (n--) {
            u8arr[n] = bstr.charCodeAt(n)
        }

        return new File([u8arr], filename, { type: mime })
    }
}