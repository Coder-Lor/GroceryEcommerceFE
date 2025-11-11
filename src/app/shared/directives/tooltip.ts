import { Directive, HostBinding, Input } from '@angular/core';

@Directive({
  selector: '[appTooltip]',
  standalone: true,
})
export class TooltipDirective {
  // Text truyền vào qua [appTooltip]
  @Input('appTooltip')
  set tooltip(value: string | null | undefined) {
    this.tooltipText = value ?? '';
  }

  // Gắn vào data-tooltip để CSS global đọc
  @HostBinding('attr.data-tooltip')
  tooltipText: string = '';

  // Gắn class btn luôn cho tiện
  @HostBinding('class.btn')
  btnClass = true;
}
