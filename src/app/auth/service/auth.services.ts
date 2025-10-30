import { Injectable, PLATFORM_ID, Inject } from "@angular/core"
import { Router } from "@angular/router"
import { AngularFireAuth } from "@angular/fire/compat/auth"
import { AngularFirestore } from "@angular/fire/compat/firestore"
import { from, Observable, map, switchMap, of } from "rxjs"
import { isPlatformBrowser } from "@angular/common"
import { environment } from "../../../environments/environments"
import firebase from "firebase/compat/app"
import "firebase/compat/auth"

@Injectable({
  providedIn: "root",
})
export class AuthService {
  private userMe = `${environment.ms_user}/api/users`

  currentUser$ = this.afAuth.authState;

  constructor(
    public afAuth: AngularFireAuth,
    private firestore: AngularFirestore,
    private router: Router,
    @Inject(PLATFORM_ID) private platformId: Object
  ) { }

  /**
   * 🔐 LOGIN PRINCIPAL
   */
  login(email: string, password: string): Observable<any> {
    return from(this.afAuth.signInWithEmailAndPassword(email, password)).pipe(
      switchMap((userCredential) => {
        const user = userCredential.user
        if (!user) throw new Error("No se pudo iniciar sesión")
        return from(user.getIdTokenResult(true)).pipe(
          switchMap((idTokenResult) => {
            const token = idTokenResult.token
            if (isPlatformBrowser(this.platformId)) {
              localStorage.setItem("authToken", token)
            }
            return from(
              fetch(`${this.userMe}/me`, {
                headers: { Authorization: `Bearer ${token}` },
              }).then(async (res) => {
                if (!res.ok) throw new Error("No se pudo obtener el usuario")
                const userInfo = await res.json()
                if (isPlatformBrowser(this.platformId)) {
                  localStorage.setItem("userRole", userInfo.role)
                  localStorage.setItem("userInfo", JSON.stringify(userInfo))
                }
                return userInfo
              }),
            )
          }),
        )
      }),
    )
  }

  /**
   * 🔑 Obtener token de Firebase (método que faltaba)
   */
  async getFirebaseToken(): Promise<string | null> {
    try {
      const user = await this.afAuth.currentUser
      if (user) {
        return await user.getIdToken(true)
      }
      // Si no hay usuario en Firebase, intentar desde localStorage
      return isPlatformBrowser(this.platformId) ? localStorage.getItem("authToken") : null
    } catch (error) {
      console.error("Error al obtener token de Firebase:", error)
      return isPlatformBrowser(this.platformId) ? localStorage.getItem("authToken") : null
    }
  }

  /**
   * 🏷️ Obtener rol del usuario desde localStorage
   */
  getRole(): string | null {
    return isPlatformBrowser(this.platformId) ? localStorage.getItem("userRole") : null
  }

  /**
   * ✅ Verificar si hay token guardado (usuario autenticado)
   */
  hasToken(): boolean {
    return isPlatformBrowser(this.platformId) ? !!localStorage.getItem("authToken") : false
  }

  /**
   * 🔑 Obtener token actual del usuario (desde Firebase)
   */
  async getCurrentToken(): Promise<string | null> {
    const user = await this.afAuth.currentUser
    return user ? user.getIdToken() : null
  }

  /**
   * 🔄 Observar si hay un usuario autenticado
   */
  isAuthenticated(): Observable<boolean> {
    return this.afAuth.authState.pipe(map((user) => !!user))
  }

  /**
   * 🛡️ Verificar si el usuario tiene rol ADMIN (por claims de Firebase)
   */
  isAdmin(): Observable<boolean> {
    return this.afAuth.idTokenResult.pipe(map((token) => token?.claims?.["role"] === "ADMIN"))
  }

  /**
   * 🔁 Obtener rol desde token (claims personalizados en Firebase)
   */
  getUserRole(): Observable<string | null> {
    return this.currentUser$.pipe(
      switchMap((user) => (user ? from(user.getIdTokenResult(true)) : of(null))),
      map((tokenResult) => tokenResult?.claims?.["role"] || null),
    )
  }

  /**
   * 🔒 Verificar si el usuario es ADMIN de forma síncrona
   */
  isAdminSync(): boolean {
    const role = this.getRole()
    return role === "ADMIN" || role === "admin"
  }

  /**
   * 👤 Verificar si el usuario es USER de forma síncrona
   */
  isUserSync(): boolean {
    const role = this.getRole()
    return role === "USER" || role === "user"
  }

  /**
   * ✍️ Verificar si el usuario puede realizar operaciones de escritura
   */
  canWrite(): boolean {
    return this.isAdminSync()
  }

  /**
   * 📖 Verificar si el usuario puede realizar operaciones de lectura
   */
  canRead(): boolean {
    return this.isAdminSync() || this.isUserSync()
  }

  /**
   * 🎭 Obtener el tipo de rol de forma legible
   */
  getRoleType(): "admin" | "user" | "unknown" {
    if (this.isAdminSync()) return "admin"
    if (this.isUserSync()) return "user"
    return "unknown"
  }

  /**
   * 🚪 Cerrar sesión y limpiar localStorage
   */
  logout(): void {
    this.afAuth.signOut().then(() => {
      if (isPlatformBrowser(this.platformId)) {
        localStorage.removeItem("authToken")
        localStorage.removeItem("userRole")
        localStorage.removeItem("userInfo")
      }
      this.router.navigate(["/login"])
    })
  }

  /**
   * 🙋 Obtener información del usuario autenticado desde la API
   */
  getLoggedUserInfo(): Observable<any> {
    const token = localStorage.getItem("authToken")
    return from(
      fetch(`${this.userMe}/me`, {
        headers: { Authorization: `Bearer ${token}` },
      }).then(async (res) => {
        if (!res.ok) {
          const error = await res.json()
          throw new Error(error.message || "Error al obtener el usuario")
        }
        return res.json()
      }),
    )
  }

  /**
   * ✍️ Actualizar perfil del usuario
   */
  updateMyProfile(profile: any) {
    const token = localStorage.getItem("authToken")
    return from(
      fetch(`${this.userMe}/me`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(profile),
      }).then(async (res) => {
        if (!res.ok) {
          const error = await res.json()
          throw new Error(error.message || "Error al actualizar el perfil")
        }
        return res.json()
      }),
    )
  }

  /**
   * 🔐 Cambiar contraseña del usuario
   */
  changePassword(newPassword: string) {
    const token = localStorage.getItem("authToken")
    return from(
      fetch(`${this.userMe}/password`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ newPassword }),
      }).then(async (res) => {
        if (!res.ok) {
          const error = await res.json()
          throw new Error(error.message || "Error al cambiar contraseña")
        }
        return res.json()
      }),
    )
  }

  /**
   * 📧 Cambiar correo electrónico del usuario
   */
  changeEmail(newEmail: string) {
    const token = localStorage.getItem("authToken")
    return from(
      fetch(`${this.userMe}/email`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ newEmail }),
      }).then(async (res) => {
        if (!res.ok) {
          const error = await res.json()
          throw new Error(error.message || "Error al cambiar correo")
        }
        return res.json()
      }),
    )
  }

  /**
   * ✅ Reautenticación obligatoria antes de cambios sensibles
   */
  reauthenticate(currentPassword: string): Promise<firebase.auth.UserCredential> {
    return this.afAuth.currentUser.then((user) => {
      if (!user || !user.email) {
        throw new Error("Usuario no autenticado")
      }
      const credential = firebase.auth.EmailAuthProvider.credential(user.email, currentPassword)
      return user.reauthenticateWithCredential(credential)
    })
  }
}
