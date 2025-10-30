import { AuthService } from './../../auth/service/auth.services';
import { User } from '../../../interfaces/User';
import { CommonModule } from "@angular/common"
import { Component, OnInit, OnDestroy } from "@angular/core"
import { Router } from "@angular/router"
import { Subscription } from "rxjs"

@Component({
  selector: "app-navbar",
  standalone: true,
  imports: [CommonModule],
  templateUrl: "./navbar.component.html",
  styleUrls: ["./navbar.component.css"],
})
export class NavbarComponent implements OnInit, OnDestroy {
  menuOpen = false
  userMenuOpen = false
  sidebarOpen = false
  logoutModalOpen = false

  currentUser: User | null = null
  imageError = false
  imageLoading = true

  private documentClickListener: any

  constructor(
    private router: Router,
    private authService: AuthService,
  ) { }

  ngOnInit(): void {
    this.documentClickListener = this.handleDocumentClick.bind(this)
    document.addEventListener("click", this.documentClickListener)

    // Obtener info del usuario actual desde localStorage (si fue almacenada)
    const rawUser = localStorage.getItem("userInfo")
    if (rawUser) {
      this.currentUser = JSON.parse(rawUser)
    }
  }

  ngOnDestroy(): void {
    document.removeEventListener("click", this.documentClickListener)
  }

  handleDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement
    const userMenuContainer = document.querySelector(".group.relative")
    if (this.userMenuOpen && userMenuContainer && !userMenuContainer.contains(target)) {
      this.userMenuOpen = false
    }
  }

  toggleMenu(event?: Event): void {
    if (event) event.stopPropagation()
    this.menuOpen = !this.menuOpen
  }

  toggleUserMenu(event?: Event): void {
    if (event) event.stopPropagation()
    this.userMenuOpen = !this.userMenuOpen
  }

  toggleSidebar(): void {
    this.sidebarOpen = !this.sidebarOpen
    this.emitSidebarToggle()
  }

  private emitSidebarToggle(): void {
    const event = new CustomEvent("sidebar-toggle", {
      detail: { isOpen: this.sidebarOpen },
    })
    window.dispatchEvent(event)
  }

  formatEmail(email: string | undefined): string {
    if (!email) return ""
    const atIndex = email.indexOf("@")
    if (atIndex <= 0) return email
    const firstPart = email.substring(0, Math.min(3, atIndex))
    const domain = email.substring(atIndex)
    return firstPart + "******" + domain
  }

  getProfileImageUrl(): string {
    return this.currentUser?.profileImage || ""
  }

  hasProfileImage(): boolean {
    const imageUrl = this.getProfileImageUrl()
    return !!(imageUrl && imageUrl.trim() !== "" && !this.imageError)
  }

  onImageError(): void {
    this.imageError = true
    this.imageLoading = false
    console.error("Error al cargar la imagen de perfil:", this.getProfileImageUrl())
  }

  onImageLoad(): void {
    this.imageError = false
    this.imageLoading = false
    console.log("Imagen de perfil cargada correctamente:", this.getProfileImageUrl())
  }

  // ✅ Nuevo método para obtener el nombre completo
  getFullName(): string {
    const firstName = this.currentUser?.name || ''
    const lastName = this.currentUser?.lastName || ''
    
    if (firstName && lastName) {
      return `${firstName} ${lastName}`
    } else if (firstName) {
      return firstName
    } else if (lastName) {
      return lastName
    } else {
      return 'Usuario'
    }
  }

  // ✅ Usar getRole() y dar formato localmente
  getFormattedRole(): string {
    const role = this.authService.getRole()
    if (!role) return ""
    return role.charAt(0).toUpperCase() + role.slice(1).toLowerCase()
  }

  openLogoutModal(): void {
    this.userMenuOpen = false
    this.logoutModalOpen = true
  }

  closeLogoutModal(): void {
    this.logoutModalOpen = false
  }

  confirmLogout(): void {
    try {
      this.authService.logout()
      console.log("Sesión cerrada exitosamente")
      this.closeLogoutModal()
    } catch (error) {
      console.error("Error al cerrar sesión:", error)
      this.closeLogoutModal()
    }
  }

  handleProfileClick(event: Event): void {
    event.preventDefault()
    this.userMenuOpen = false
    this.router.navigate(["/perfil"])
  }

  handleSettingsClick(event: Event): void {
    event.preventDefault()
    this.userMenuOpen = false
    this.router.navigate(["/configuracion"])
  }
}