import { Component, ChangeDetectionStrategy } from '@angular/core';
import { RouterModule } from '@angular/router';

/**
 * UnauthorizedComponent - Displayed when user tries to access a resource they don't have permission for
 */
@Component({
    selector: 'app-unauthorized',
    imports: [RouterModule],
    changeDetection: ChangeDetectionStrategy.OnPush,
    templateUrl: './unauthorized.component.html',
    styleUrls: ['./unauthorized.component.scss']
})
export class UnauthorizedComponent {
}
