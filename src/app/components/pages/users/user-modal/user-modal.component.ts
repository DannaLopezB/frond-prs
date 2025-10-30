import { UserService } from "./../../../../../service/user.service"
import type { User } from "../../../../../interfaces/User"
import {
  Component,
  EventEmitter,
  Input,
  type OnChanges,
  type OnInit,
  Output,
  type SimpleChanges,
  type AfterViewInit,
} from "@angular/core"
import { CommonModule } from "@angular/common"
import { FormBuilder, type FormGroup, ReactiveFormsModule, Validators } from "@angular/forms"
import Swal from "sweetalert2"
import { debounceTime, distinctUntilChanged, switchMap } from "rxjs/operators"
import { of } from "rxjs"

@Component({
  selector: "app-user-modal",
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: "./user-modal.component.html",
  styleUrls: ["./user-modal.component.css"],
})
export class UserModalComponent implements OnInit, OnChanges, AfterViewInit {
  @Input() user: User | null = null
  @Output() formSubmit = new EventEmitter<User>()
  @Output() formCancel = new EventEmitter<void>()

  userForm!: FormGroup
  isEditing = false
  isSubmitting = false
  showPassword = false
  profilePreview: string | null = null

  constructor(
    private fb: FormBuilder,
    private userService: UserService,
  ) {}

  ngOnInit(): void {
    this.createForm()
  }

  ngAfterViewInit(): void {
    if (this.user && this.user.id && this.userForm) {
      setTimeout(() => {
        this.updateFormWithUserData()
      })
    }
  }

  updateFormWithUserData(): void {
    if (!this.user) return

    this.userForm.reset()
    this.userForm.patchValue({
      id: this.user.id,
      name: this.user.name,
      lastName: this.user.lastName,
      documentType: this.user.documentType,
      documentNumber: this.user.documentNumber,
      cellPhone: this.user.cellPhone,
      email: this.user.email,
      role: this.user.role[0] || "USER",
      firebaseUid: this.user.firebaseUid || "",
      profileImage: this.user.profileImage || "",
      password: "********",
    })

    this.profilePreview = this.user.profileImage || null
    this.userForm.get("email")?.disable()
    this.userForm.get("password")?.disable()
    this.userForm.get("password")?.clearValidators()
    this.userForm.get("password")?.updateValueAndValidity()
    this.isEditing = true
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes["user"] && changes["user"].currentValue && this.userForm) {
      if (this.user && this.user.id) {
        this.updateFormWithUserData()
      } else {
        this.isEditing = false
        this.profilePreview = null
        this.userForm.reset()
        this.userForm.get("email")?.enable()
        this.userForm.get("password")?.enable()
        this.userForm.get("password")?.setValidators([Validators.required, Validators.minLength(6)])
        this.userForm.get("password")?.updateValueAndValidity()
      }
    }
  }

  createForm(): void {
    this.userForm = this.fb.group({
      id: [null],
      name: ["", [Validators.required, Validators.pattern(/^[A-Z][a-zA-Z0-9 ]*$/)]],
      lastName: ["", [Validators.required, Validators.pattern(/^([A-Z][a-z]*)(\s[A-Z][a-z]*)*$/)]],
      documentType: ["DNI", Validators.required],
      documentNumber: ["", [Validators.required, Validators.pattern(/^\d+$/), this.documentNumberValidator()]],
      cellPhone: ["", [Validators.required, Validators.pattern(/^\d{9}$/)]],
      email: ["", [Validators.required, Validators.email]],
      password: ["", [Validators.minLength(6)]],
      role: ["USER", Validators.required],
      firebaseUid: [""],
      profileImage: ["", Validators.required],
    })

    this.userForm.get("documentType")?.valueChanges.subscribe(() => {
      this.userForm.get("documentNumber")?.updateValueAndValidity()
    })

    this.userForm
      .get("email")
      ?.valueChanges.pipe(
        debounceTime(500),
        distinctUntilChanged(),
        switchMap((email) => {
          if (this.isEditing || !email || this.userForm.get("email")?.hasError("email")) {
            return of(false)
          }
          return this.userService.checkEmailExistsFast(email)
        }),
      )
      .subscribe((emailExists) => {
        const emailControl = this.userForm.get("email")
        if (emailExists && !this.isEditing) {
          emailControl?.setErrors({ ...emailControl.errors, emailTaken: true })
        } else if (emailControl?.hasError("emailTaken")) {
          const errors = { ...emailControl.errors }
          delete errors["emailTaken"]
          emailControl.setErrors(Object.keys(errors).length > 0 ? errors : null)
        }
      })
  }

  documentNumberValidator() {
    return (control: any) => {
      const type = this.userForm?.get("documentType")?.value
      const value = control.value
      if (type === "DNI" && value?.length !== 8) return { invalidLength: true }
      if (type === "CNE" && (value?.length < 8 || value?.length > 20)) return { invalidLength: true }
      return null
    }
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword
  }

  onImageSelected(event: any): void {
    const file: File = event.target.files[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e: any) => {
      const img = new Image()
      img.src = e.target.result
      img.onload = () => {
        const canvas = document.createElement("canvas")
        const MAX_WIDTH = 300
        const scaleSize = MAX_WIDTH / img.width
        canvas.width = MAX_WIDTH
        canvas.height = img.height * scaleSize

        const ctx = canvas.getContext("2d")
        if (!ctx) return

        ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
        const compressedBase64 = canvas.toDataURL("image/jpeg", 0.7)
        const base64Length = compressedBase64.length - (compressedBase64.indexOf(",") + 1)
        const sizeInKB = (4 * Math.ceil(base64Length / 3)) / 1024

        if (sizeInKB > 200) {
          Swal.fire({
            icon: "warning",
            title: "Imagen demasiado grande",
            text: `La imagen comprimida aún pesa ${Math.round(sizeInKB)} KB. Usa una más ligera.`,
            confirmButtonText: "Entendido",
            customClass: {
              popup: "bg-white",
            },
          })
          return
        }

        this.profilePreview = compressedBase64
        this.userForm.patchValue({ profileImage: compressedBase64 })

        Swal.fire({
          icon: "success",
          title: "¡Imagen cargada!",
          text: `Imagen optimizada (${Math.round(sizeInKB)} KB)`,
          timer: 2000,
          showConfirmButton: false,
          customClass: {
            popup: "bg-white",
          },
        })
      }
    }
    reader.readAsDataURL(file)
  }

  onSubmit(): void {
    if (this.userForm.valid) {
      if (!this.profilePreview && !this.isEditing) {
        Swal.fire({
          icon: "error",
          title: "Imagen requerida",
          text: "Por favor, seleccione una imagen de perfil",
          confirmButtonText: "Entendido",
          customClass: {
            popup: "bg-white",
          },
        })
        return
      }

      this.isSubmitting = true
      const formValue = this.userForm.getRawValue()

      if (this.isEditing) {
        if (!formValue.password || formValue.password === "********") {
          delete formValue.password
        }
        delete formValue.firebaseUid
      } else {
        delete formValue.id
        delete formValue.firebaseUid
      }

      formValue.role = [formValue.role.toUpperCase()]

      if (this.isEditing) {
        if (this.profilePreview && this.profilePreview !== this.user?.profileImage) {
          formValue.profileImage = this.profilePreview
        } else if (!this.profilePreview) {
          formValue.profileImage = ""
        } else {
          delete formValue.profileImage
        }
      } else {
        formValue.profileImage = this.profilePreview || ""
      }

      console.log("📤 Datos finales a enviar:", formValue)
      this.formSubmit.emit(formValue)
      this.isSubmitting = false
    } else {
      this.userForm.markAllAsTouched()
      if (this.userForm.get("profileImage")?.hasError("required") && !this.profilePreview) {
        Swal.fire({
          icon: "error",
          title: "Imagen requerida",
          text: "Por favor, seleccione una imagen de perfil",
          confirmButtonText: "Entendido",
          customClass: {
            popup: "bg-white",
          },
        })
      }
    }
  }

  onCancel(): void {
    this.formCancel.emit()
  }

  capitalizeFirstLetter(event: any): void {
    const input = event.target
    if (input.value.length > 0) {
      input.value = input.value.charAt(0).toUpperCase() + input.value.slice(1)
    }
  }

  capitalizeEachWord(event: any): void {
    const input = event.target
    const words = input.value.split(" ")
    const capitalized = words.map((word: string) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    input.value = capitalized.join(" ")
  }
}