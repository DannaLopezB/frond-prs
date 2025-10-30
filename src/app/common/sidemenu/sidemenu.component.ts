import { AuthService } from './../../auth/service/auth.services';
import { MENU_ITEMS } from './../../utils/menu-items';
import { Component, OnInit, OnDestroy, HostListener, Inject, PLATFORM_ID } from "@angular/core";
import { Router } from "@angular/router";
import { CommonModule, isPlatformBrowser } from "@angular/common";
import { RouterModule } from "@angular/router";
import { HttpClientModule } from "@angular/common/http";
import { Subscription } from "rxjs";
import { trigger, transition, style, animate } from "@angular/animations";

interface Route {
  title: string;
  path?: string;
  icon?: string;
  children?: Route[];
  role?: string[];
}

@Component({
  selector: "app-sidemenu",
  standalone: true,
  imports: [CommonModule, RouterModule, HttpClientModule],
  templateUrl: "./sidemenu.component.html",
  animations: [
    trigger("fadeInOut", [
      transition(":enter", [style({ opacity: 0 }), animate("300ms ease-out", style({ opacity: 1 }))]),
      transition(":leave", [animate("200ms ease-in", style({ opacity: 0 }))]),
    ]),
  ],
})
export class SidemenuComponent implements OnInit, OnDestroy {
  dropdownIndex: number | null = null;
  subDropdownIndex: Map<number, number | null> = new Map();
  grandSubDropdownIndex: Map<number, Map<number, number | null>> = new Map();
  menuItems: Route[] = [];
  isSidebarOpen = false;
  isMobile = false;
  logoutModalOpen = false;

  private resizeListener: any;
  private sidebarToggleListener: any;
  private isBrowser: boolean;

  constructor(
    private router: Router,
    private authService: AuthService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(this.platformId);
  }

  ngOnInit(): void {
    if (this.isBrowser) {
      this.sidebarToggleListener = this.listenForSidebarToggle();
      this.checkScreenSize();
      this.filterMenuByRole();
      this.router.events.subscribe(() => this.checkActiveRoute());
    }
  }

  ngOnDestroy(): void {
    if (this.isBrowser) {
      window.removeEventListener("resize", this.resizeListener);
      window.removeEventListener("sidebar-toggle", this.sidebarToggleListener);
    }
  }

  private filterMenuByRole(): void {
    const rawUser = localStorage.getItem("userInfo");
    if (!rawUser) {
      this.menuItems = [];
      return;
    }

    const user = JSON.parse(rawUser);
    const roles = user.role || ["USER"];

    this.menuItems = this.filterMenuItems(MENU_ITEMS, roles);
    this.checkActiveRoute();
  }

  private filterMenuItems(items: Route[], userRoles: string[]): Route[] {
    return items
      .filter((item) => {
        if (!item.role || item.role.length === 0) return true;
        return item.role.some((role) => userRoles.includes(role));
      })
      .map((item) => {
        if (item.children) {
          const filteredChildren = this.filterMenuItems(item.children, userRoles);
          return { ...item, children: filteredChildren };
        }
        return item;
      });
  }

  private listenForSidebarToggle(): any {
    const listener = (event: any) => {
      if (event.detail && event.detail.hasOwnProperty("isOpen")) {
        this.isSidebarOpen = event.detail.isOpen;
      }
    };

    window.addEventListener("sidebar-toggle", listener);
    return listener;
  }

  @HostListener("window:resize", ["$event"])
  onResize() {
    this.checkScreenSize();
  }

  private checkScreenSize(): void {
    if (this.isBrowser) {
      this.isMobile = window.innerWidth < 1024;
      this.isSidebarOpen = window.innerWidth >= 1024;
    }
  }

  private checkActiveRoute(): void {
    const currentUrl = this.router.url;

    this.dropdownIndex = null;
    this.subDropdownIndex.clear();
    this.grandSubDropdownIndex.clear();

    this.menuItems.forEach((item, index) => {
      if (item.path && currentUrl.startsWith(item.path)) {
        this.dropdownIndex = index;
      }

      if (item.children) {
        item.children.forEach((child, childIndex) => {
          const fullPath = (item.path ? item.path + '/' : '/') + (child.path || '');
          if (child.path && currentUrl.startsWith(fullPath)) {
            this.dropdownIndex = index;
            this.subDropdownIndex.set(index, childIndex);
          }

          if (child.children) {
            child.children.forEach((grandChild, grandChildIndex) => {
              const fullGrandPath = fullPath + '/' + (grandChild.path || '');
              if (grandChild.path && currentUrl.startsWith(fullGrandPath)) {
                this.dropdownIndex = index;
                this.subDropdownIndex.set(index, childIndex);
                if (!this.grandSubDropdownIndex.has(index)) {
                  this.grandSubDropdownIndex.set(index, new Map());
                }
                this.grandSubDropdownIndex.get(index)!.set(childIndex, grandChildIndex);
              }
            });
          }
        });
      }
    });
  }

  toggleDropdown(index: number): void {
    this.dropdownIndex = this.dropdownIndex === index ? null : index;
  }

  toggleSubDropdown(parentIndex: number, childIndex: number): void {
    const current = this.subDropdownIndex.get(parentIndex);
    this.subDropdownIndex.set(parentIndex, current === childIndex ? null : childIndex);
  }

  toggleGrandSubDropdown(parentIndex: number, childIndex: number, grandChildIndex: number): void {
    if (!this.grandSubDropdownIndex.has(parentIndex)) {
      this.grandSubDropdownIndex.set(parentIndex, new Map());
    }
    const subMap = this.grandSubDropdownIndex.get(parentIndex)!;
    const current = subMap.get(childIndex);
    subMap.set(childIndex, current === grandChildIndex ? null : grandChildIndex);
  }

  closeSidebar(): void {
    if (this.isMobile) {
      this.isSidebarOpen = false;
    }
  }

  isRouteActive(path: string): boolean {
    return this.router.url.startsWith(path);
  }

  openLogoutModal(): void {
    this.logoutModalOpen = true;
  }

  closeLogoutModal(): void {
    this.logoutModalOpen = false;
  }

  logout(): void {
    this.openLogoutModal();
    if (this.isMobile) {
      this.closeSidebar();
    }
  }

  confirmLogout(): void {
    try {
      this.authService.logout();
      console.log("Sesión cerrada correctamente");
      this.closeLogoutModal();
      this.router.navigate(["/login"]);
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
      this.closeLogoutModal();
    }
  }
}
