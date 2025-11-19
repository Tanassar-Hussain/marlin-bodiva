import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  ViewEncapsulation
} from '@angular/core';

import { UserService } from "../../../core/user/user.service";
import { fuseAnimations } from "@fuse/animations";
import { ToastrService } from "ngx-toastr";
import { AuthService } from 'app/core/auth/auth.service';
import { AbstractControl, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { TranslocoService } from '@ngneat/transloco';
import { FuseLoaderScreenService } from '@fuse/services/splash-screen';
import { MatDialogRef } from '@angular/material/dialog';
import { TranslateService } from '@ngx-translate/core';


@Component({
  selector: 'change-password-component',
  templateUrl: './change-password-component.html',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: fuseAnimations,
})
export class ChangePasswordComponent implements OnInit {

  updatePassswordForm: FormGroup;
  currentLang: string;
  activelang: string;
  userFromSession: any;
  optionsToaster: import("ngx-toastr").GlobalConfig;

  constructor(
    private _formBuilder: FormBuilder,
    private transloco: TranslocoService,
    private translate: TranslateService,
    private toast: ToastrService,
    private splash: FuseLoaderScreenService,
    private _authService: AuthService,
    public matDialogRef: MatDialogRef<ChangePasswordComponent>,
  ) {
    this.userFromSession = JSON.parse(sessionStorage.getItem('user'));
    this.currentLang = localStorage.getItem("lang")
    if (this.currentLang != null) {
      this.transloco.setActiveLang(this.currentLang)
      this.activelang = this.transloco.getActiveLang();
    }
    this.optionsToaster = this.toast.toastrConfig;
    this.optionsToaster.timeOut = 2000;
    this.optionsToaster.autoDismiss = true;
  }

  ngOnInit(): void {
    this.initializeUserForm()
  }

  initializeUserForm() {

    this.updatePassswordForm = this._formBuilder.group({
      currentPassword: ['', Validators.required],
      password: ['', Validators.compose([Validators.required, this.removeSpaces, Validators.pattern("^(?=.*[0-9])(?=.*[a-zA-Z])([a-zA-Z0-9]+){8,50}$")])],
      confirmPassword: ['', Validators.compose([Validators.required, this.removeSpaces, this.matchConfirmPassword.bind(this)])],

    });
  }


  onUpdatePassword() {
    this.updatePassswordForm.markAllAsTouched();


    if (this.updatePassswordForm.valid) {
      let formData = this.updatePassswordForm.getRawValue();

      const data = {
        email: this.userFromSession.email,
        password: formData.password,
        oldPassword: formData.currentPassword,
      };

      if (formData.password != formData.confirmPassword) {
        this.updatePassswordForm.reset();
        if (this.currentLang == 'pt') {
          this.toast.error('A senha e a senha de confirmação não coincidem', 'Erro')
        } else
          this.toast.error('The password and confirmation password do not match', 'Error')
        return;
      }

      this.splash.show();

      this._authService.updatePassword(data)
        .subscribe((response) => {
          this.splash.hide();
          if (response.response === false) {
            if (response.message == "Password is not equel to old Password.") {
              this.translate.get(['Translation.Password is not equel to old Password.', 'Translation.Error']).subscribe((res: any) => {
                let msg = res['Translation.Password is not equel to old Password.']
                let error = res['Translation.Error']
                //this.toast.error(msg, error)
                this.updatePassswordForm.reset();
              })
            }
            else {
             // this.toast.error(response.message, 'Error')
              this.updatePassswordForm.reset();
            }
          }
          if (response.response === true) {
            if (response.message == "Password changed Successfully.") {
              this.translate.get(['Translation.Password changed Successfully.', 'Translation.Success']).subscribe((res: any) => {
                let msg = res['Translation.Password changed Successfully.']
                let success = res['Translation.Success']
                this.toast.success(msg, success)
                this.updatePassswordForm.disable();
              })
            }
            else {
              this.toast.success(response.message, 'Success')
              this.updatePassswordForm.disable();
            }
          }


        }, (error) => {

          this.splash.hide();
        }
        );
    }
  }

  onCloseDialog() {
    this.matDialogRef.close();
  }

  removeSpaces(control: AbstractControl) {
    if (control && control.value && !control.value.replace(/\s/g, '').length) {
      control.setValue('');
    }
    return null;
  }

  matchConfirmPassword(control: AbstractControl): { [key: string]: boolean } | null {
    const password = control.root.get('password');
    const confirmPassword = control.value;

    if (password && confirmPassword !== password.value) {
      return { 'mismatch': true };
    }

    return null;
  }


}


