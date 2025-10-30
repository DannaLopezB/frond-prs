import { User } from "../interfaces/User"
import { AuthService } from "../app/auth/service/auth.services"
import { environment } from "../environments/environments"
import { Injectable } from "@angular/core"
import { HttpClient, HttpHeaders } from "@angular/common/http"
import { Observable, from, of, throwError } from "rxjs"
import { catchError, map, switchMap, timeout, tap } from "rxjs/operators"

@Injectable({
    providedIn: "root",
})
export class UserService {
    private userAdmin = `${environment.ms_user}/api/admin/users`

    constructor(
        private http: HttpClient,
        private authService: AuthService,
    ) { }

    private getHeaders(): Observable<HttpHeaders> {
        return from(this.authService.getFirebaseToken()).pipe(
            map(
                (token) =>
                    new HttpHeaders({
                        Authorization: `Bearer ${token}`,
                    }),
            ),
        )
    }

    getUserById(id: number): Observable<User | null> {
        return this.getHeaders().pipe(
            switchMap((headers) =>
                this.http.get<User>(`${this.userAdmin}/${id}`, { headers }).pipe(
                    timeout(15000),
                    catchError((error) => {
                        console.error(`Error al obtener usuario con ID ${id}:`, error)
                        return of(null)
                    }),
                ),
            ),
        )
    }

    createUser(user: User, file: File | null = null): Observable<User> {
        const formData = new FormData()

        // Crear una copia del usuario sin campos innecesarios
        const userForJson = { ...user }

        // Remover campos que no deben enviarse al crear
        delete userForJson.id // ✅ ESTO ES LO IMPORTANTE - No enviar ID al crear
        delete userForJson.firebaseUid // Tampoco enviar firebaseUid

        if (userForJson.profileImage && userForJson.profileImage.startsWith("data:image/")) {
            delete userForJson.profileImage // Remover base64 del JSON
        }

        // Agregar el JSON del usuario como string (igual que en Postman)
        formData.append("user", JSON.stringify(userForJson))

        // Agregar el archivo si existe
        if (file) {
            formData.append("file", file)
        }

        console.log("📤 Enviando FormData:")
        console.log("- user (JSON):", JSON.stringify(userForJson))
        console.log("- file:", file ? file.name : "No file")

        return this.getHeaders().pipe(
            switchMap((headers) => {
                // Para FormData, NO incluir Content-Type - el browser lo maneja automáticamente
                const formHeaders = new HttpHeaders({
                    Authorization: headers.get("Authorization") || "",
                })

                return this.http.post<User>(this.userAdmin, formData, { headers: formHeaders }).pipe(
                    timeout(30000),
                    tap((response) => console.log("✅ Usuario creado exitosamente:", response)),
                    catchError((error) => {
                        console.error("❌ Error al crear usuario en backend:", error)
                        console.error("❌ Error details:", error.error)

                        let errorMessage = "Error al guardar el usuario."

                        if (error.error?.message) {
                            errorMessage = error.error.message
                        } else if (error.message) {
                            errorMessage = error.message
                        } else if (error.status === 500) {
                            errorMessage = "Error interno del servidor. Verifique los datos enviados."
                        }

                        return throwError(() => new Error(errorMessage))
                    }),
                )
            }),
        )
    }

    getAllUsers(): Observable<User[]> {
        return this.getHeaders().pipe(
            switchMap((headers) =>
                this.http.get<User[]>(this.userAdmin, { headers }).pipe(
                    timeout(15000),
                    tap((users) => console.log("✅ Usuarios obtenidos:", users.length)),
                    catchError((error) => {
                        console.error("❌ Error al obtener usuarios:", error)
                        return of([])
                    }),
                ),
            ),
        )
    }

    updateUser(user: User, file: File | null = null): Observable<User> {
        const formData = new FormData()

        // Crear una copia del usuario sin campos innecesarios
        const userForJson = { ...user }

        // Para actualización, SÍ incluir el ID pero no firebaseUid
        delete userForJson.firebaseUid
        delete userForJson.password // No enviar password en actualización

        if (userForJson.profileImage && userForJson.profileImage.startsWith("data:image/")) {
            delete userForJson.profileImage // Remover base64 del JSON
        }

        // Agregar el JSON del usuario como string (igual que en Postman)
        formData.append("user", JSON.stringify(userForJson))

        // Agregar el archivo si existe
        if (file) {
            formData.append("file", file)
        }

        console.log("📤 Actualizando con FormData:")
        console.log("- user (JSON):", JSON.stringify(userForJson))
        console.log("- file:", file ? file.name : "No file")

        return this.getHeaders().pipe(
            switchMap((headers) => {
                // Para FormData, NO incluir Content-Type
                const formHeaders = new HttpHeaders({
                    Authorization: headers.get("Authorization") || "",
                })

                return this.http.put<User>(`${this.userAdmin}/${user.id}`, formData, { headers: formHeaders }).pipe(
                    timeout(30000),
                    tap((response) => console.log("✅ Usuario actualizado exitosamente:", response)),
                    catchError((error) => {
                        console.error("❌ Error al actualizar usuario:", error)
                        console.error("❌ Error details:", error.error)

                        let errorMessage = "No se pudo actualizar el usuario."

                        if (error.error?.message) {
                            errorMessage = error.error.message
                        } else if (error.message) {
                            errorMessage = error.message
                        } else if (error.status === 500) {
                            errorMessage = "Error interno del servidor. Verifique los datos enviados."
                        }

                        return throwError(() => new Error(errorMessage))
                    }),
                )
            }),
        )
    }

    deleteUser(id: number): Observable<void> {
        return this.getHeaders().pipe(
            switchMap((headers) =>
                this.http.delete<void>(`${this.userAdmin}/${id}`, { headers }).pipe(
                    timeout(15000),
                    tap(() => console.log("✅ Usuario eliminado exitosamente")),
                    catchError((error) => {
                        console.error("❌ Error al eliminar usuario:", error)
                        return throwError(() => new Error("No se pudo eliminar el usuario."))
                    }),
                ),
            ),
        )
    }

    getUserByEmail(email: string): Observable<User | null> {
        return this.getHeaders().pipe(
            switchMap((headers) =>
                this.http.get<User>(`${this.userAdmin}/email/${email}`, { headers }).pipe(
                    timeout(15000),
                    catchError((error) => {
                        console.error("Error al obtener usuario por email:", error)
                        return of(null)
                    }),
                ),
            ),
        )
    }

    checkEmailExists(email: string): Observable<boolean> {
        return this.getUserByEmail(email).pipe(
            map((user) => !!user),
            catchError(() => of(false)),
        )
    }

    checkEmailExistsFast(email: string): Observable<boolean> {
        return this.getHeaders().pipe(
            switchMap((headers) =>
                this.http.get<boolean>(`${this.userAdmin}/email-exists/${email}`, { headers }).pipe(
                    timeout(10000),
                    catchError((err) => {
                        console.error("❌ Error al verificar email duplicado:", err)
                        return of(false)
                    }),
                ),
            ),
        )
    }
}