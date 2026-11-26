import { Pipe, PipeTransform } from '@angular/core';

// Utils
import { getFlagClass } from '@utils';

@Pipe({ name: 'flag' })
export class FlagPipe implements PipeTransform {
  transform(code: string): string {
    return getFlagClass(code);
  }
}
