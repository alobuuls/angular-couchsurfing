import { inject, Injectable } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { TranslateService } from '@ngx-translate/core';

// Interfaces
import { IErrResp } from '@interfaces/data-structure-api';

@Injectable({
  providedIn: 'root',
})
export class ErrorHandlerService {
  private _translate = inject(TranslateService);

  handle(error: unknown): IErrResp {
    if (error instanceof HttpErrorResponse) {
      // Error de red o falta de conexión
      if (error.status === 0) {
        return {
          message: this._translate.instant('ERRORS.HTTP.502'),
          status: 0,
        };
      }

      return {
        status: error.status,
        message: this._translate.instant(`ERRORS.HTTP.${error.status}`) || this._translate.instant('ERRORS.HTTP.DEFAULT'),
      };
    }

    // Error no controlado
    return {
      message: this._translate.instant('ERRORS.HTTP.DEFAULT'),
    };
  }
}
